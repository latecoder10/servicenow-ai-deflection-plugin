<#
  ============================================================
  set-scope.ps1
  ============================================================
  A new ServiceNow instance generates a new application scope
  (e.g. x_1234567_ai_tic_0). This rewrites every occurrence of
  the old scope in this folder so you can paste the files into
  Studio without hand-editing them.

  Usage (from the repo root):
     .\servicenow-plugin\set-scope.ps1 -NewScope x_1234567_ai_tic_0

  Dry run first if you want to see what changes:
     .\servicenow-plugin\set-scope.ps1 -NewScope x_1234567_ai_tic_0 -WhatIf
  ============================================================
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^x_[a-z0-9]+_[a-z0-9_]+$')]
    [string]$NewScope,

    [string]$OldScope = 'x_2185757_ai_tic_0'
)

$ErrorActionPreference = 'Stop'
$folder = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($NewScope -eq $OldScope) {
    Write-Host "New scope is identical to the old scope. Nothing to do." -ForegroundColor Yellow
    exit 0
}

$targets = Get-ChildItem -Path $folder -File -Include *.js, *.xml, *.json, *.md, *.html -Recurse

$touched = 0
foreach ($file in $targets) {
    $content = Get-Content -Path $file.FullName -Raw

    if ($content -notmatch [regex]::Escape($OldScope)) {
        continue
    }

    $hits = ([regex]::Matches($content, [regex]::Escape($OldScope))).Count
    $updated = $content -replace [regex]::Escape($OldScope), $NewScope

    if ($PSCmdlet.ShouldProcess($file.Name, "replace $hits occurrence(s)")) {
        Set-Content -Path $file.FullName -Value $updated -Encoding utf8 -NoNewline
        Write-Host ("  {0,-32} {1} replaced" -f $file.Name, $hits) -ForegroundColor Green
        $touched = $touched + 1
    }
}

if ($touched -eq 0) {
    Write-Host "No files contained '$OldScope'. Was the scope already changed?" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Done. $touched file(s) now use scope '$NewScope'." -ForegroundColor Cyan
    Write-Host "Re-paste 01-script-include.js and 02-ui-macro-sidebar.xml into Studio." -ForegroundColor Cyan
}
