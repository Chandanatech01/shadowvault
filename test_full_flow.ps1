# ==============================================================================
# ShadowVault End-to-End Test Suite with Brand-New Accounts (MySQL 8 Runtime)
# ==============================================================================

$baseUrl = "http://localhost:8080/api"
$results = [ordered]@{}
$rand = Get-Random -Minimum 10000 -Maximum 99999

Write-Host "=================================================================="
Write-Host "ShadowVault Real Authentication & Trust Flow Test Suite"
Write-Host "Run ID: $rand against $baseUrl"
Write-Host "=================================================================="

$LF = "`r`n"
$enc = [System.Text.Encoding]::UTF8

# ------------------------------------------------------------------------------
# 1. Register brand-new Victim
# ------------------------------------------------------------------------------
$victimUname = "victim_$rand"
$victimToken = $null
$inviteCode = $null
try {
    $victimBody = @{
        role = "VICTIM"
        fullName = "Test Victim $rand"
        phone = "+91 98765 11111"
        email = "$victimUname@shadowvault.local"
        username = $victimUname
        password = "Password123!"
        guardianName = "Guardian Nominee $rand"
        guardianPhone = "+91 98765 22222"
    } | ConvertTo-Json

    $vRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $victimBody -ContentType "application/json"
    $victimToken = $vRes.token
    $inviteCode = $vRes.guardianInviteCode
    $otp = $vRes.simulatedOtp

    if ($victimToken -and $inviteCode -and $otp) {
        $results["1_RegisterVictim"] = "PASSED - Created '$victimUname' | OTP: $otp | Invite Code: $inviteCode"
        Write-Host "[PASS] 1. Register Victim: PASSED (Invite Code: $inviteCode, OTP: $otp)" -ForegroundColor Green
    } else {
        throw "Missing token ($victimToken), inviteCode ($inviteCode), or OTP ($otp)"
    }
} catch {
    $results["1_RegisterVictim"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 1. Register Victim: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 2. Register brand-new Guardian with the invite code
# ------------------------------------------------------------------------------
$guardianUname = "guardian_$rand"
$guardianToken = $null
try {
    $guardianBody = @{
        role = "GUARDIAN"
        fullName = "Test Guardian $rand"
        phone = "+91 98765 22222"
        email = "$guardianUname@shadowvault.local"
        username = $guardianUname
        password = "Password123!"
        guardianInviteCode = $inviteCode
    } | ConvertTo-Json

    $gRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $guardianBody -ContentType "application/json"
    $guardianToken = $gRes.token
    $linkedVictim = $gRes.linkedVictim

    if ($guardianToken -and ($linkedVictim -eq $victimUname)) {
        $results["2_RegisterGuardian"] = "PASSED - Created '$guardianUname' linked to victim '$linkedVictim'"
        Write-Host "[PASS] 2. Register Guardian: PASSED (Linked to: $linkedVictim)" -ForegroundColor Green
    } else {
        throw "Guardian linking failed. Returned linkedVictim: $linkedVictim"
    }
} catch {
    $results["2_RegisterGuardian"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 2. Register Guardian: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 3. Register brand-new Authority with the access code (AUTH-2026)
# ------------------------------------------------------------------------------
$authorityUname = "authority_$rand"
$authorityToken = $null
try {
    $authBody = @{
        role = "AUTHORITY"
        fullName = "Inspector Verma $rand"
        phone = "+91 98111 33333"
        email = "$authorityUname@shadowvault.gov.in"
        username = $authorityUname
        password = "Password123!"
        department = "Cyber Crime Investigation Cell"
        authorityAccessCode = "AUTH-2026"
    } | ConvertTo-Json

    $aRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $authBody -ContentType "application/json"
    $authorityToken = $aRes.token
    $dept = $aRes.user.department

    if ($authorityToken -and $dept) {
        $results["3_RegisterAuthority"] = "PASSED - Created '$authorityUname' for department '$dept'"
        Write-Host "[PASS] 3. Register Authority: PASSED (Department: $dept)" -ForegroundColor Green
    } else {
        throw "Authority creation failed"
    }
} catch {
    $results["3_RegisterAuthority"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 3. Register Authority: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 4. Victim uploads two items (Text & Image)
# ------------------------------------------------------------------------------
$caseId = $null
$evidenceId1 = $null
$evidenceId2 = $null
try {
    # 4a. Item 1 - Text statement
    $boundaryA = [System.Guid]::NewGuid().ToString()
    $bodyLinesA = @(
        "--$boundaryA", 'Content-Disposition: form-data; name="type"', '', 'TEXT',
        "--$boundaryA", 'Content-Disposition: form-data; name="description"', '', 'Direct extortion threat note.',
        "--$boundaryA", 'Content-Disposition: form-data; name="text"', '', 'Pay 50,000 INR immediately or confidential data will be released.',
        "--$boundaryA", 'Content-Disposition: form-data; name="tags"', '', 'THREAT,HARASSMENT',
        "--$boundaryA--"
    ) -join $LF
    $headersA = @{ "Authorization" = "Bearer $victimToken"; "Content-Type" = "multipart/form-data; boundary=$boundaryA" }
    $textRes = Invoke-RestMethod -Uri "$baseUrl/cases/evidence" -Method Post -Body $bodyLinesA -Headers $headersA
    $caseId = $textRes.caseId
    $evidenceId1 = $textRes.evidenceId
    Write-Host "[PASS] 4a. Upload Text Evidence: PASSED (Case: $caseId, Seq: $($textRes.sequenceNumber))" -ForegroundColor Green

    # 4b. Item 2 - Image file
    $boundaryB = [System.Guid]::NewGuid().ToString()
    $pngBytes = [System.Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
    $msB = New-Object System.IO.MemoryStream
    $b = $enc.GetBytes("--$boundaryB$LF" + "Content-Disposition: form-data; name=`"type`"$LF$LF" + "IMAGE$LF"); $msB.Write($b, 0, $b.Length)
    $b = $enc.GetBytes("--$boundaryB$LF" + "Content-Disposition: form-data; name=`"description`"$LF$LF" + "CCTV capture of suspicious individual outside residence.$LF"); $msB.Write($b, 0, $b.Length)
    $b = $enc.GetBytes("--$boundaryB$LF" + "Content-Disposition: form-data; name=`"tags`"$LF$LF" + "PHYSICAL_HARM,STALKING$LF"); $msB.Write($b, 0, $b.Length)
    $b = $enc.GetBytes("--$boundaryB$LF" + "Content-Disposition: form-data; name=`"file`"; filename=`"cctv.png`"$LF" + "Content-Type: image/png$LF$LF"); $msB.Write($b, 0, $b.Length)
    $msB.Write($pngBytes, 0, $pngBytes.Length)
    $b = $enc.GetBytes("$LF--$boundaryB--$LF"); $msB.Write($b, 0, $b.Length)
    $bytesB = $msB.ToArray(); $msB.Dispose()
    $headersB = @{ "Authorization" = "Bearer $victimToken"; "Content-Type" = "multipart/form-data; boundary=$boundaryB" }
    $imgRes = Invoke-RestMethod -Uri "$baseUrl/cases/evidence" -Method Post -Body $bytesB -Headers $headersB
    $evidenceId2 = $imgRes.evidenceId
    Write-Host "[PASS] 4b. Upload Image Evidence: PASSED (Case: $caseId, Seq: $($imgRes.sequenceNumber), PrevHash: $($imgRes.prevChainHash.Substring(0, 10))...)" -ForegroundColor Green

    $results["4_UploadTwoItems"] = "PASSED - Uploaded 2 items in chain (Case: $caseId, Tier: $($imgRes.caseSeverityLevel))"
} catch {
    $results["4_UploadTwoItems"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 4. Upload Two Items: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 5. Authority requests access
# ------------------------------------------------------------------------------
$requestId = $null
try {
    $reqBody = @{ reason = "Official forensic investigation of online extortion" } | ConvertTo-Json
    $reqRes = Invoke-RestMethod -Uri "$baseUrl/authority/cases/$caseId/request-access" -Method Post -Body $reqBody -Headers @{ "Authorization" = "Bearer $authorityToken" } -ContentType "application/json"
    $requestId = $reqRes.requestId
    if ($requestId -and $reqRes.status -eq "PENDING") {
        $results["5_AuthorityRequestAccess"] = "PASSED - Request created (ID: $requestId, Status: PENDING)"
        Write-Host "[PASS] 5. Authority Requests Access: PASSED (Request ID: $requestId, Status: PENDING)" -ForegroundColor Green
    } else {
        throw "Invalid access request response"
    }
} catch {
    $results["5_AuthorityRequestAccess"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 5. Authority Requests Access: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 6. Victim marks unavailable
# ------------------------------------------------------------------------------
try {
    $toggleRes = Invoke-RestMethod -Uri "$baseUrl/auth/toggle-availability" -Method Post -Body "{}" -Headers @{ "Authorization" = "Bearer $victimToken" } -ContentType "application/json"
    if ($toggleRes.unavailable -eq $true) {
        $results["6_VictimMarksUnavailable"] = "PASSED - Victim marked UNAVAILABLE (Escalation unlocked for Guardian)"
        Write-Host "[PASS] 6. Victim Marks Unavailable: PASSED (Unavailable: true)" -ForegroundColor Green
    } else {
        throw "Failed to set unavailable status"
    }
} catch {
    $results["6_VictimMarksUnavailable"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 6. Victim Marks Unavailable: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 7. Guardian approves access
# ------------------------------------------------------------------------------
try {
    # 7a. Guardian inspects pending queue
    $guardRequests = Invoke-RestMethod -Uri "$baseUrl/guardian/requests" -Method Get -Headers @{ "Authorization" = "Bearer $guardianToken" }
    $targetReq = $guardRequests | Where-Object { $_.id -eq $requestId }

    if (-not $targetReq) {
        throw "Guardian could not locate request $requestId for linked ward $victimUname"
    }
    if (-not $targetReq.canApprove) {
        throw "Guardian canApprove flag is false despite victim being marked unavailable"
    }
    Write-Host "[PASS] 7a. Guardian Sees Ward Request: PASSED (canApprove=$($targetReq.canApprove), victimUnavailable=$($targetReq.victimUnavailable))" -ForegroundColor Green

    # 7b. Guardian approves
    $approveBody = @{ approve = $true } | ConvertTo-Json
    $approveRes = Invoke-RestMethod -Uri "$baseUrl/guardian/requests/$requestId/respond" -Method Post -Body $approveBody -Headers @{ "Authorization" = "Bearer $guardianToken" } -ContentType "application/json"

    if ($approveRes.status -eq "APPROVED" -and $approveRes.accessGranted -eq $true -and $approveRes.approvedBy -eq "GUARDIAN") {
        $results["7_GuardianApproves"] = "PASSED - Approved by Guardian '$guardianUname' (accessGranted: true)"
        Write-Host "[PASS] 7b. Guardian Approves Access: PASSED (ApprovedBy: GUARDIAN, AccessGranted: true)" -ForegroundColor Green
    } else {
        throw "Approval failed: status=$($approveRes.status)"
    }
} catch {
    $results["7_GuardianApproves"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 7. Guardian Approves: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 8. Authority decrypts and sees VERIFIED
# ------------------------------------------------------------------------------
try {
    $evidenceReport = Invoke-RestMethod -Uri "$baseUrl/authority/cases/$caseId/evidence" -Method Get -Headers @{ "Authorization" = "Bearer $authorityToken" }

    $chainValid = $evidenceReport.chainValid
    $overallIntegrity = $evidenceReport.overallIntegrity
    $victimName = $evidenceReport.victimName
    $itemsCount = $evidenceReport.items.Count

    if ($chainValid -and ($overallIntegrity -eq "VERIFIED") -and ($victimName -eq "Test Victim $rand") -and ($itemsCount -eq 2)) {
        $results["8_AuthorityDecryptVerified"] = "PASSED - Decrypted 2 items | Integrity: VERIFIED | ChainValid: true | Victim: '$victimName'"
        Write-Host "[PASS] 8. Authority Decrypts: PASSED (Overall: VERIFIED, ChainValid: true, Victim: $victimName)" -ForegroundColor Green
    } else {
        throw "Verification mismatch: Overall=$overallIntegrity, ChainValid=$chainValid, Name=$victimName"
    }
} catch {
    $results["8_AuthorityDecryptVerified"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 8. Authority Decrypts: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 9. Simulate tampering and see TAMPERED
# ------------------------------------------------------------------------------
try {
    # Corrupt item 2
    $tamperRes = Invoke-RestMethod -Uri "$baseUrl/dev/tamper/$evidenceId2" -Method Post -Body "{}" -Headers @{ "Authorization" = "Bearer $victimToken" } -ContentType "application/json"
    if (-not $tamperRes.success) {
        throw "Tamper simulation endpoint failed: $($tamperRes.error)"
    }
    Write-Host "[PASS] 9a. Tamper Simulation Applied to Item #${evidenceId2}: PASSED" -ForegroundColor Green

    # Re-verify as Authority
    $tamperInspect = Invoke-RestMethod -Uri "$baseUrl/authority/cases/$caseId/evidence" -Method Get -Headers @{ "Authorization" = "Bearer $authorityToken" }
    $tamperDetected = (-not $tamperInspect.chainValid) -and ($tamperInspect.overallIntegrity -eq "TAMPERED")

    if ($tamperDetected) {
        $brokenIndex = $tamperInspect.firstBrokenIndex
        $results["9_TamperDetectionTampered"] = "PASSED - Tampering Detected! OverallIntegrity: TAMPERED | ChainValid: false | Broken Item Index: $brokenIndex"
        Write-Host "[PASS] 9b. Authority Verification Detects Tamper: PASSED (Overall: TAMPERED, ChainValid: false, Broken Index: $brokenIndex)" -ForegroundColor Green
    } else {
        throw "Verification engine failed to flag tampering. Overall=$($tamperInspect.overallIntegrity)"
    }
} catch {
    $results["9_TamperDetectionTampered"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 9. Simulate Tampering: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# Summary Output
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "=================================================================="
Write-Host "FULL FLOW EXECUTION SUMMARY (BRAND-NEW ACCOUNTS):"
Write-Host "=================================================================="
$results.GetEnumerator() | ForEach-Object {
    Write-Host "$($_.Key): $($_.Value)"
}
Write-Host "=================================================================="
