# Exports each slide of a PowerPoint file as a PNG image and extracts speaker notes.
# Requires Microsoft Office (PowerPoint) to be installed.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\pptx-to-images.ps1 -PptxPath "path\to\file.pptx" -OutDir "public\pptx-slides"
# Output:
#   Slide1.PNG, Slide2.PNG, ... — one image per slide, $Width px wide (height keeps the slide's aspect)
#   slide-notes.json            — speaker notes per slide (empty string if none), UTF-8 without BOM

param(
  [Parameter(Mandatory)][string]$PptxPath,
  [Parameter(Mandatory)][string]$OutDir,
  # Export width in pixels; matches the 1920x1080 video so slides are not upscaled
  [int]$Width = 1920
)

$pptx = [System.IO.Path]::GetFullPath($PptxPath)
$out  = [System.IO.Path]::GetFullPath($OutDir)

if (-not (Test-Path $pptx)) {
  Write-Error "File not found: $pptx"
  exit 1
}

New-Item -ItemType Directory -Force -Path $out | Out-Null

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

try {
  $deck = $ppt.Presentations.Open($pptx, $false, $false, $false)

  # Export all slides as PNG images. Height follows the slide's own aspect ratio,
  # so 4:3 decks are not stretched (the video letterboxes them).
  $height = [int][Math]::Round($Width * $deck.PageSetup.SlideHeight / $deck.PageSetup.SlideWidth)
  $deck.Export($out, "PNG", $Width, $height)

  # Extract speaker notes for each slide (placeholder type 2 = notes body)
  $notes = @()
  foreach ($slide in $deck.Slides) {
    $noteText = ""
    try {
      $noteShape = $slide.NotesPage.Shapes | Where-Object {
        $_.PlaceholderFormat -ne $null -and $_.PlaceholderFormat.Type -eq 2
      } | Select-Object -First 1
      if ($noteShape) {
        $noteText = $noteShape.TextFrame.TextRange.Text.Trim()
      }
    } catch {}
    $notes += [PSCustomObject]@{ slideIndex = $slide.SlideIndex; notes = $noteText }
  }

  # -InputObject keeps a one-slide deck as a JSON array; UTF8Encoding($false) writes no BOM
  $notesJson = ConvertTo-Json -InputObject @($notes) -Depth 3
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText((Join-Path $out "slide-notes.json"), $notesJson, $utf8NoBom)

  # @() so .Count works when exactly one slide has notes (PowerShell 5.1 quirk)
  $withNotes = @($notes | Where-Object { $_.notes -ne "" }).Count
  Write-Host "Exported $($deck.Slides.Count) slides to $out"
  Write-Host "Speaker notes found: $withNotes of $($deck.Slides.Count) slides"

  $deck.Close()
} finally {
  $ppt.Quit()
}
