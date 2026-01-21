# Windows Toast Notification Script for oh-my-claude
# Usage: powershell -ExecutionPolicy Bypass -File notify-windows.ps1 -Title "Title" -Message "Message"

param(
    [string]$Title = "oh-my-claude",
    [string]$Message = "Task completed!",
    [string]$Icon = "Info"  # Info, Warning, Error
)

# Method 1: Try BurntToast module (best experience)
function Send-BurntToast {
    param($Title, $Message)

    try {
        if (Get-Module -ListAvailable -Name BurntToast) {
            Import-Module BurntToast -ErrorAction Stop
            New-BurntToastNotification -Text $Title, $Message -AppLogo "$PSScriptRoot\..\assets\icon.png" -ErrorAction Stop
            return $true
        }
    } catch {}
    return $false
}

# Method 2: Windows Forms balloon notification
function Send-BalloonTip {
    param($Title, $Message, $Icon)

    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop

        $balloon = New-Object System.Windows.Forms.NotifyIcon
        $balloon.Icon = [System.Drawing.SystemIcons]::Information
        $balloon.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::$Icon
        $balloon.BalloonTipTitle = $Title
        $balloon.BalloonTipText = $Message
        $balloon.Visible = $true
        $balloon.ShowBalloonTip(5000)

        # Keep alive for notification to show
        Start-Sleep -Seconds 1
        $balloon.Dispose()
        return $true
    } catch {}
    return $false
}

# Method 3: Native Windows Toast (Windows 10+)
function Send-NativeToast {
    param($Title, $Message)

    try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

        $template = @"
<toast>
    <visual>
        <binding template="ToastText02">
            <text id="1">$Title</text>
            <text id="2">$Message</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.Default"/>
</toast>
"@

        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)

        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("oh-my-claude")
        $notifier.Show($toast)
        return $true
    } catch {}
    return $false
}

# Method 4: Simple message box (fallback)
function Send-MessageBox {
    param($Title, $Message)

    try {
        Add-Type -AssemblyName PresentationFramework -ErrorAction Stop
        [System.Windows.MessageBox]::Show($Message, $Title, 'OK', 'Information') | Out-Null
        return $true
    } catch {}
    return $false
}

# Try methods in order of preference
$sent = $false

# Try BurntToast first (best UX)
if (-not $sent) { $sent = Send-BurntToast -Title $Title -Message $Message }

# Try native toast
if (-not $sent) { $sent = Send-NativeToast -Title $Title -Message $Message }

# Try balloon tip
if (-not $sent) { $sent = Send-BalloonTip -Title $Title -Message $Message -Icon $Icon }

# Last resort: message box (blocking, so skip in automated scenarios)
# if (-not $sent) { $sent = Send-MessageBox -Title $Title -Message $Message }

if ($sent) {
    exit 0
} else {
    Write-Host "Failed to send notification"
    exit 1
}
