# Local preview for GitHub Pages static site (JSON fetch requires HTTP, not file://)
$Port = 8765
$Root = $PSScriptRoot
Write-Host "Serving Rishvel at http://localhost:$Port/"
Write-Host "  Home:        http://localhost:$Port/"
Write-Host "  Experiences: http://localhost:$Port/experiences/"
Write-Host "  Mysore:      http://localhost:$Port/experiences/mysore/"
Write-Host "Press Ctrl+C to stop."
Set-Location $Root
python -m http.server $Port
