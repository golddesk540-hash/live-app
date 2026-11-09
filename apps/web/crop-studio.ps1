Add-Type -AssemblyName System.Drawing
$img = New-Object System.Drawing.Bitmap('C:\Users\HP\.gemini\antigravity\brain\d49e7e92-2cbf-4a82-b7ce-920366fb716f\phase4_refs\04_03_host_studio.png')

New-Item -ItemType Directory -Force -Path 'd:\popo live\apps\web\public\assets\studio' | Out-Null

function SaveCrop($x, $y, $w, $h, $path) {
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $img.Clone($rect, $img.PixelFormat)
    $cropped.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Host ('Saved ' + $path + ' w=' + $w + ' h=' + $h)
}

# 1. Full studio video background (x=0, y=36, w=282, h=410)
SaveCrop 0 36 282 410 'd:\popo live\apps\web\public\assets\studio\sample_studio_broadcast.png'

# 2. Host avatar (x=13, y=50, w=32, h=32)
SaveCrop 13 50 32 32 'd:\popo live\apps\web\public\assets\studio\host_zara_avatar.png'

# 3. Bottom dock icons: Effects, Filter, Share, More
SaveCrop 22 370 42 42 'd:\popo live\apps\web\public\assets\studio\dock_effects.png'
SaveCrop 84 370 42 42 'd:\popo live\apps\web\public\assets\studio\dock_filter.png'
SaveCrop 146 370 42 42 'd:\popo live\apps\web\public\assets\studio\dock_share.png'
SaveCrop 208 370 42 42 'd:\popo live\apps\web\public\assets\studio\dock_more.png'

# 4. Right side quick action buttons
SaveCrop 220 95 34 34 'd:\popo live\apps\web\public\assets\studio\btn_flip.png'
SaveCrop 220 142 34 34 'd:\popo live\apps\web\public\assets\studio\btn_beauty.png'
SaveCrop 220 188 34 34 'd:\popo live\apps\web\public\assets\studio\btn_mic.png'
SaveCrop 220 234 34 34 'd:\popo live\apps\web\public\assets\studio\btn_camera.png'
SaveCrop 220 280 34 34 'd:\popo live\apps\web\public\assets\studio\btn_sound.png'
SaveCrop 220 326 34 34 'd:\popo live\apps\web\public\assets\studio\btn_settings.png'

$img.Dispose()
