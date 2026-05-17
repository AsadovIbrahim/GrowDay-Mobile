Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -Path "C:\Apps\GrowDay-Mobile\android\app\src\main\res" -Recurse -Filter "bootsplash_logo.png"

foreach ($file in $files) {
    $img = [System.Drawing.Image]::FromFile($file.FullName)
    $tempPath = $file.FullName + "_temp.png"
    $img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Remove-Item $file.FullName
    Rename-Item $tempPath "bootsplash_logo.png"
}
