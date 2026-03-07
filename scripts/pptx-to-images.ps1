# Exports each slide of a PowerPoint file as a PNG image using Microsoft Office COM.
# Requires Microsoft Office (PowerPoint) to be installed.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\pptx-to-images.ps1 -PptxPath "path\to\file.pptx" -OutDir "temp\pptx-slides"
# Output: one PNG per slide named Slide1.png, Slide2.png, ...

param(
  [Parameter(Mandatory)][string]$PptxPath,
  [Parameter(Mandatory)][string]$OutDir
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
  # ppSaveAsPNG = 18
  $deck.Export($out, "PNG")
  $count = $deck.Slides.Count
  $deck.Close()
  Write-Host "Exported $count slides to $out"
} finally {
  $ppt.Quit()
}
