# Regenerates all PWA icons from public/logo.png with proper sizes + maskable safe zones.
# Brand red bg (#E53935) fills around the trimmed logo. Run with: powershell -File scripts/regen-icons.ps1
Add-Type -AssemblyName System.Drawing

$src = "public\logo.png"
if (-not (Test-Path $src)) { throw "Source not found: $src" }
$original = [System.Drawing.Bitmap]::FromFile($src)
$W = $original.Width; $H = $original.Height
"Source: ${W}x${H}"

# 1) Find bounding box of non-white area (trim outer transparent/white padding)
function IsWhite($p) { return ($p.R -ge 240) -and ($p.G -ge 240) -and ($p.B -ge 240) }

$top = 0
for ($y = 0; $y -lt $H; $y++) {
  $hit = $false
  for ($x = 0; $x -lt $W; $x += 3) { if (-not (IsWhite $original.GetPixel($x, $y))) { $hit = $true; break } }
  if ($hit) { $top = $y; break }
}
$bot = $H - 1
for ($y = $H - 1; $y -ge 0; $y--) {
  $hit = $false
  for ($x = 0; $x -lt $W; $x += 3) { if (-not (IsWhite $original.GetPixel($x, $y))) { $hit = $true; break } }
  if ($hit) { $bot = $y; break }
}
$lft = 0
for ($x = 0; $x -lt $W; $x++) {
  $hit = $false
  for ($y = $top; $y -le $bot; $y += 3) { if (-not (IsWhite $original.GetPixel($x, $y))) { $hit = $true; break } }
  if ($hit) { $lft = $x; break }
}
$rgt = $W - 1
for ($x = $W - 1; $x -ge 0; $x--) {
  $hit = $false
  for ($y = $top; $y -le $bot; $y += 3) { if (-not (IsWhite $original.GetPixel($x, $y))) { $hit = $true; break } }
  if ($hit) { $rgt = $x; break }
}
$cw = $rgt - $lft + 1
$ch = $bot - $top + 1
"Trim bounds: top=$top bot=$bot lft=$lft rgt=$rgt -> ${cw}x${ch}"

# 2) Render trimmed logo into a square canvas of `size`, padded by `insetRatio` of brand red.
function MakeIcon($size, $insetRatio) {
  $bg = [System.Drawing.Color]::FromArgb(255, 229, 57, 53)  # #E53935
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear($bg)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  $inset = [int]($size * $insetRatio)
  $contentSize = $size - 2 * $inset
  $aspect = $cw / $ch
  if ($aspect -ge 1) { $tw = $contentSize; $th = [int]([Math]::Round($contentSize / $aspect)) }
  else { $th = $contentSize; $tw = [int]([Math]::Round($contentSize * $aspect)) }
  $tx = [int](($size - $tw) / 2)
  $ty = [int](($size - $th) / 2)

  $srcRect = [System.Drawing.Rectangle]::new($lft, $top, $cw, $ch)
  $dstRect = [System.Drawing.Rectangle]::new($tx, $ty, $tw, $th)
  $g.DrawImage($original, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  return $bmp
}

function Save([System.Drawing.Bitmap]$bmp, $path) {
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  "  -> $path  ($((Get-Item $path).Length) bytes)"
}

# 3) Generate icon set
"Generating icons..."
# any-purpose: 작은 inset(5%) 으로 디자인을 거의 full bleed 표시
Save (MakeIcon 192 0.05) "public\icon-192.png"
Save (MakeIcon 512 0.05) "public\icon-512.png"
# maskable-purpose: Android safe-zone(중심 80% 권장) 충족을 위해 12% inset
Save (MakeIcon 512 0.12) "public\icon-maskable-512.png"
# iOS: 자체 라운딩 마스크 약간 적용되므로 6% inset
Save (MakeIcon 180 0.06) "public\apple-touch-icon.png"
# favicon: 작은 크기, 가장자리까지 활용
Save (MakeIcon 96 0.04) "public\favicon.png"
# logo.png 자체도 정사각형으로 정리 (다른 곳에서 사용될 수 있음)
Save (MakeIcon 1024 0.05) "public\logo.png"

$original.Dispose()
"Done."
