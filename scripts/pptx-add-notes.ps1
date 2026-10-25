# Appends narration text from video-script.json to each slide's speaker notes in a PPTX file.
# Requires Microsoft Office (PowerPoint) to be installed.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\pptx-add-notes.ps1 -PptxPath "path\to\file.pptx" -ScriptPath "content\video-script.json"
# Output: saves modified PPTX in-place (original is backed up as file.pptx.bak)
#
# Narration is appended after any existing notes, separated by a divider line.
# Only image-type slides are matched to original slides (by the slide number in imagePath:
# "Slide3.PNG" from PowerPoint, or "slide-03.png" from LibreOffice + pdftoppm).
# All other slide types (title, outro, section-header, etc.) are skipped.

param(
  [Parameter(Mandatory)][string]$PptxPath,
  [Parameter(Mandatory)][string]$ScriptPath
)

$pptx   = [System.IO.Path]::GetFullPath($PptxPath)
$script = [System.IO.Path]::GetFullPath($ScriptPath)

if (-not (Test-Path $pptx))   { Write-Error "PPTX not found: $pptx";   exit 1 }
if (-not (Test-Path $script)) { Write-Error "Script not found: $script"; exit 1 }

# Parse video-script.json — collect image slides and their narration
# -Encoding UTF8: Windows PowerShell 5.1 reads BOM-less files as ANSI, which garbles Vietnamese text
$videoScript = Get-Content $script -Raw -Encoding UTF8 | ConvertFrom-Json
$imageSlides = @($videoScript.slides | Where-Object { $_.type -eq "image" })

if ($imageSlides.Count -eq 0) {
  Write-Host "No image-type slides found in script. Nothing to write back."
  exit 0
}

# Build a map: slideIndex (1-based) -> narration text
# imagePath is like "pptx-slides/Slide3.PNG" or "pptx-slides/slide-03.png" — take the number
$slideNumberPattern = '(?i)slide-?(\d+)\.(png|jpe?g)$'
$narrationMap = @{}
foreach ($slide in $imageSlides) {
  if ($slide.imagePath -match $slideNumberPattern) {
    $narrationMap[[int]$Matches[1]] = $slide.narration
  }
}

if ($narrationMap.Count -eq 0) {
  Write-Host "Could not parse slide numbers from imagePath fields. Expected pptx-slides/SlideN.PNG or pptx-slides/slide-N.png"
  exit 1
}

# Back up the original file
$backup = "$pptx.bak"
Copy-Item -Path $pptx -Destination $backup -Force
Write-Host "Backup saved: $backup"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

try {
  $deck = $ppt.Presentations.Open($pptx, $false, $false, $false)
  $divider = "`n---`n"
  $updated = 0

  foreach ($slide in $deck.Slides) {
    $narration = $narrationMap[$slide.SlideIndex]
    if (-not $narration) { continue }

    $noteShape = $slide.NotesPage.Shapes | Where-Object {
      $_.PlaceholderFormat -ne $null -and $_.PlaceholderFormat.Type -eq 2
    } | Select-Object -First 1

    if ($noteShape) {
      $existing = $noteShape.TextFrame.TextRange.Text.Trim()
      $newText   = if ($existing) { "$existing$divider$narration" } else { $narration }
      $noteShape.TextFrame.TextRange.Text = $newText
      $updated++
    }
  }

  $deck.Save()
  $deck.Close()
  Write-Host "Updated speaker notes on $updated slides. Saved: $pptx"
} finally {
  $ppt.Quit()
}
