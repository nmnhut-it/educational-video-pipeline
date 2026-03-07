# Appends narration text from video-script.json to each slide's speaker notes in a PPTX file.
# Requires Microsoft Office (PowerPoint) to be installed.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\pptx-add-notes.ps1 -PptxPath "path\to\file.pptx" -ScriptPath "content\video-script.json"
# Output: saves modified PPTX in-place (original is backed up as file.pptx.bak)
#
# Narration is appended after any existing notes, separated by a divider line.
# Only image-type slides are matched to original slides (by slideIndex in imagePath).
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
$videoScript = Get-Content $script -Raw | ConvertFrom-Json
$imageSlides = $videoScript.slides | Where-Object { $_.type -eq "image" }

if ($imageSlides.Count -eq 0) {
  Write-Host "No image-type slides found in script. Nothing to write back."
  exit 0
}

# Build a map: slideIndex (1-based) -> narration text
# imagePath is like "pptx-slides/Slide3.PNG" — extract the number from the filename
$narrationMap = @{}
foreach ($slide in $imageSlides) {
  if ($slide.imagePath -match "Slide(\d+)\.", [ref]$null) {
    $idx = [int]($slide.imagePath -replace ".*Slide(\d+)\..*", '$1')
    $narrationMap[$idx] = $slide.narration
  }
}

if ($narrationMap.Count -eq 0) {
  Write-Host "Could not parse slide indices from imagePath fields. Expected format: pptx-slides/SlideN.PNG"
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
