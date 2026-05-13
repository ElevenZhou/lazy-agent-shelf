param(
  [ValidateSet("Basic", "AI", "Full")]
  [string]$Mode = "Basic",
  [switch]$DryRun,
  [switch]$OpenWebsites,
  [string]$WorkspaceRoot = "D:\Workspace"
)

$ErrorActionPreference = "Stop"
$KitRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$AppsCsv = Join-Path $KitRoot "apps.csv"
$WebsitesCsv = Join-Path $KitRoot "websites.csv"
$ReportPath = Join-Path $KitRoot "setup-report.md"

$Completed = New-Object System.Collections.Generic.List[string]
$Skipped = New-Object System.Collections.Generic.List[string]
$Manual = New-Object System.Collections.Generic.List[string]
$Risks = New-Object System.Collections.Generic.List[string]

function Add-ReportItem {
  param(
    [ValidateSet("Completed", "Skipped", "Manual", "Risks")]
    [string]$Kind,
    [string]$Message
  )
  switch ($Kind) {
    "Completed" { $Completed.Add($Message) | Out-Null }
    "Skipped" { $Skipped.Add($Message) | Out-Null }
    "Manual" { $Manual.Add($Message) | Out-Null }
    "Risks" { $Risks.Add($Message) | Out-Null }
  }
}

function Write-Step {
  param([string]$Message)
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-DryRun {
  param([string]$Message)
  Write-Host "[DryRun] $Message" -ForegroundColor Yellow
}

function Invoke-LoggedCommand {
  param(
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$Label
  )
  $cmd = "$FilePath $($Arguments -join ' ')"
  if ($DryRun) {
    Write-DryRun $cmd
    Add-ReportItem -Kind "Skipped" -Message "DryRun: $Label -> $cmd"
    return
  }
  Write-Host $cmd -ForegroundColor DarkGray
  & $FilePath @Arguments
  Add-ReportItem -Kind "Completed" -Message $Label
}

function Test-CommandExists {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Ensure-Folders {
  $folders = @(
    "Projects",
    "AI",
    "AI\Models",
    "AI\ComfyUI",
    "Services",
    "Documents",
    "Downloads\Installers",
    "Scripts",
    "Backups"
  )
  Write-Step "Create recommended folders under $WorkspaceRoot"
  foreach ($folder in $folders) {
    $path = Join-Path $WorkspaceRoot $folder
    if ($DryRun) {
      Write-DryRun "New-Item -ItemType Directory -Force -Path `"$path`""
      Add-ReportItem -Kind "Skipped" -Message "DryRun folder: $path"
    } else {
      New-Item -ItemType Directory -Force -Path $path | Out-Null
      Add-ReportItem -Kind "Completed" -Message "Folder ensured: $path"
    }
  }
}

function Install-WingetApp {
  param(
    [string]$Name,
    [string]$Id
  )
  if (-not (Test-CommandExists "winget")) {
    Write-Warning "winget not found; skipped $Name ($Id)"
    Add-ReportItem -Kind "Skipped" -Message "winget not found: $Name ($Id)"
    return
  }
  Write-Step "Install/check $Name"
  Invoke-LoggedCommand "winget" @("install", "--id", $Id, "-e", "--accept-package-agreements", "--accept-source-agreements") "winget install/check $Name"
}

function Open-UrlSafe {
  param([string]$Url)
  if ([string]::IsNullOrWhiteSpace($Url) -or $Url -eq "无" -or $Url -eq "none") { return }
  if ($DryRun) {
    Write-DryRun "Start-Process $Url"
    Add-ReportItem -Kind "Skipped" -Message "DryRun open URL: $Url"
  } else {
    Start-Process $Url
    Add-ReportItem -Kind "Completed" -Message "Opened URL: $Url"
  }
}

function Import-CsvUtf8 {
  param([string]$Path)
  if ($PSVersionTable.PSVersion.Major -ge 6) {
    return Import-Csv -LiteralPath $Path -Encoding utf8
  }
  return Import-Csv -LiteralPath $Path -Encoding UTF8
}

function Write-SetupReport {
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("# Personal AI Workstation Setup Report") | Out-Null
  $lines.Add("") | Out-Null
  $lines.Add("- Mode: $Mode") | Out-Null
  $lines.Add("- DryRun: $DryRun") | Out-Null
  $lines.Add("- Generated at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')") | Out-Null
  $lines.Add("") | Out-Null

  $sections = @(
    @{ Title = "Completed"; Items = $Completed },
    @{ Title = "Skipped"; Items = $Skipped },
    @{ Title = "Needs manual action"; Items = $Manual },
    @{ Title = "Risks / notes"; Items = $Risks }
  )
  foreach ($section in $sections) {
    $lines.Add("## $($section.Title)") | Out-Null
    if ($section.Items.Count -eq 0) {
      $lines.Add("- None") | Out-Null
    } else {
      foreach ($item in $section.Items) { $lines.Add("- $item") | Out-Null }
    }
    $lines.Add("") | Out-Null
  }

  if ($DryRun) {
    Write-DryRun "Write setup report to $ReportPath"
    $preview = $lines -join [Environment]::NewLine
    Write-Host $preview
    return
  }
  $lines | Set-Content -LiteralPath $ReportPath -Encoding UTF8
  Write-Step "Report written: $ReportPath"
}

$basicWinget = [ordered]@{
  "Chrome" = "Google.Chrome"
  "VS Code" = "Microsoft.VisualStudioCode"
  "PowerShell 7" = "Microsoft.PowerShell"
  "Git" = "Git.Git"
  "Node.js LTS" = "OpenJS.NodeJS.LTS"
  "Python 3" = "Python.Python.3.12"
}

$aiWinget = [ordered]@{
  "Cherry Studio" = "CherryHQ.CherryStudio"
  "Clash Verge Rev" = "ClashVergeRev.ClashVergeRev"
}

try {
  Write-Step "Personal AI Workstation bootstrap: Mode=$Mode DryRun=$DryRun"
  Add-ReportItem -Kind "Risks" -Message "Account login, API keys, proxy subscriptions, paid actions, and system service registration must be handled manually."
  Add-ReportItem -Kind "Risks" -Message "Review websites.csv/websites.yaml before public sharing; they may contain private domains."
  Ensure-Folders

  if ($Mode -in @("Basic", "Full")) {
    foreach ($item in $basicWinget.GetEnumerator()) {
      Install-WingetApp -Name $item.Key -Id $item.Value
    }
  }

  if ($Mode -in @("AI", "Full")) {
    foreach ($item in $aiWinget.GetEnumerator()) {
      Install-WingetApp -Name $item.Key -Id $item.Value
    }
  }

  if (Test-Path $AppsCsv) {
    $apps = Import-CsvUtf8 $AppsCsv
    $manualApps = $apps | Where-Object { $_."下载地址" -and $_."下载地址" -ne "无" } | Select-Object -First 12
    Write-Step "Manual download entries, first 12"
    foreach ($app in $manualApps) {
      $line = "{0}: {1}" -f $app."名字", $app."下载地址"
      Write-Host "- $line"
      Add-ReportItem -Kind "Manual" -Message $line
    }
  } else {
    Add-ReportItem -Kind "Skipped" -Message "apps.csv not found"
  }

  if ($OpenWebsites -and (Test-Path $WebsitesCsv)) {
    Write-Step "Open common websites, first 12"
    $sites = Import-CsvUtf8 $WebsitesCsv | Select-Object -First 12
    foreach ($site in $sites) {
      $domain = $site."域名"
      if ([string]::IsNullOrWhiteSpace($domain)) { continue }
      if ($domain -match "^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)") {
        Add-ReportItem -Kind "Risks" -Message "Private/local domain requested via -OpenWebsites: $domain"
        Open-UrlSafe "http://$domain/"
      } else {
        Open-UrlSafe "https://$domain/"
      }
    }
  }

  Add-ReportItem -Kind "Manual" -Message "Manually sign in to required accounts after installs finish."
  Add-ReportItem -Kind "Manual" -Message "Configure API keys, tokens, proxy subscriptions, and paid services only after explicit confirmation."
  Write-Step "Done. Manual confirmation is required for accounts, secrets, proxies, paid actions, and system services."
} finally {
  Write-SetupReport
}
