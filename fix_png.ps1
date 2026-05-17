Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Apps\GrowDay-Mobile\android\app\src\main\res\drawable\bootsplash_logo.png')
$img.Save('C:\Apps\GrowDay-Mobile\android\app\src\main\res\drawable\bootsplash_logo_temp.png', [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Remove-Item 'C:\Apps\GrowDay-Mobile\android\app\src\main\res\drawable\bootsplash_logo.png'
Rename-Item 'C:\Apps\GrowDay-Mobile\android\app\src\main\res\drawable\bootsplash_logo_temp.png' 'bootsplash_logo.png'
