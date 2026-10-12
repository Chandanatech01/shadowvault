# Full end-to-end integration test suite against MySQL 8 backend

$baseUrl = "http://localhost:8080/api"
$results = [ordered]@{}

Write-Host "===================================================="
Write-Host "ShadowVault Full Flow Test Suite (MySQL 8 Runtime)"
Write-Host "===================================================="

# ---------------------------------------------------------------
# Step 1: Register a new victim (with Guardian link)
# ---------------------------------------------------------------
$regToken = $null
$regUser = $null
try {
    $uname = "sunita_" + (Get-Random -Minimum 1000 -Maximum 9999)
    $mail = $uname + "@shadowvault.local"
    $regBody = @{
        username = $uname
        email = $mail
        password = "Password123!"
        fullName = "Sunita Rao"
        phone = "+91 99887 76655"
        guardianName = "Anita Sharma"
        guardianPhone = "+91 98765 43211"
        guardianUsername = "guardian1"
    } | ConvertTo-Json
    
    $regRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBody -ContentType "application/json"
    $regToken = $regRes.token
    $regUser = $regRes.username
    if ($regToken -and $regRes.simulatedOtp) {
        $results["1_Register"] = "PASSED - Created victim user '$regUser' with simulated OTP $($regRes.simulatedOtp)"
        Write-Host "[PASS] 1. Register: PASSED"
    } else {
        $results["1_Register"] = "FAILED - Missing token or simulated OTP"
        Write-Host "[FAIL] 1. Register: FAILED"
    }
} catch {
    $results["1_Register"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 1. Register: FAILED - $($_.Exception.Message)"
}

# ---------------------------------------------------------------
# Step 2: Login as victim1
# ---------------------------------------------------------------
$victimToken = $null
try {
    $loginBody = @{ username = "victim1"; password = "demo123" } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $victimToken = $loginRes.token
    if ($victimToken) {
        $results["2_VictimLogin"] = "PASSED - Authenticated victim1, JWT issued"
        Write-Host "[PASS] 2. Login victim1: PASSED"
    } else {
        $results["2_VictimLogin"] = "FAILED - No token returned"
        Write-Host "[FAIL] 2. Login victim1: FAILED"
    }
} catch {
    $results["2_VictimLogin"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 2. Login victim1: FAILED - $($_.Exception.Message)"
}

# ---------------------------------------------------------------
# Step 3: Upload Text, Image, Audio Evidence for victim1
# ---------------------------------------------------------------
$victimCaseId = $null
try {
    $LF = "`r`n"
    $enc = [System.Text.Encoding]::UTF8

    # 3a. Text statement
    $boundaryA = [System.Guid]::NewGuid().ToString()
    $bodyLinesA = @(
        "--$boundaryA", 'Content-Disposition: form-data; name="type"', '', 'TEXT',
        "--$boundaryA", 'Content-Disposition: form-data; name="description"', '', 'Threatening handwritten letter left on car windshield.',
        "--$boundaryA", 'Content-Disposition: form-data; name="text"', '', 'We are watching you every day. Withdraw your report immediately.',
        "--$boundaryA", 'Content-Disposition: form-data; name="tags"', '', 'THREAT,HARASSMENT',
        "--$boundaryA--"
    ) -join $LF
    $headersA = @{ "Authorization" = "Bearer $victimToken"; "Content-Type" = "multipart/form-data; boundary=$boundaryA" }
    $textRes = Invoke-RestMethod -Uri "$baseUrl/cases/evidence" -Method Post -Body $bodyLinesA -Headers $headersA
    $victimCaseId = $textRes.caseId
    Write-Host "[PASS] 3a. Upload Text Evidence: PASSED (Case: $victimCaseId)"

    # 3b. Image evidence
    $boundaryB = [System.Guid]::NewGuid().ToString()
    $pngBytes = [System.Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
    $msB = New-Object System.IO.MemoryStream
    $b = $enc.GetBytes("--$boundaryB$LF" + "Content-Disposition: form-data; name=`"type`"$LF$LF" + "IMAGE$LF"); $msB.Write($b, 0, $b.Length)
    $b = $enc.GetBytes("--$boundaryB$LF" + "Content-Disposition: form-data; name=`"description`"$LF$LF" + "Photo of vandalized property door lock.$LF"); $msB.Write($b, 0, $b.Length)
    $b = $enc.GetBytes("--$boundaryB$LF" + "Content-Disposition: form-data; name=`"tags`"$LF$LF" + "PHYSICAL_HARM$LF"); $msB.Write($b, 0, $b.Length)
    $b = $enc.GetBytes("--$boundaryB$LF" + "Content-Disposition: form-data; name=`"file`"; filename=`"vandalism.png`"$LF" + "Content-Type: image/png$LF$LF"); $msB.Write($b, 0, $b.Length)
    $msB.Write($pngBytes, 0, $pngBytes.Length)
    $b = $enc.GetBytes("$LF--$boundaryB--$LF"); $msB.Write($b, 0, $b.Length)
    $bytesB = $msB.ToArray(); $msB.Dispose()
    $headersB = @{ "Authorization" = "Bearer $victimToken"; "Content-Type" = "multipart/form-data; boundary=$boundaryB" }
    $imgRes = Invoke-RestMethod -Uri "$baseUrl/cases/evidence" -Method Post -Body $bytesB -Headers $headersB
    Write-Host "[PASS] 3b. Upload Image Evidence: PASSED"

    # 3c. Audio evidence
    $boundaryC = [System.Guid]::NewGuid().ToString()
    $audioBytes = [System.Text.Encoding]::UTF8.GetBytes("RIFFtestWAVEfmt fake audio recording of perpetrator vocal threats")
    $msC = New-Object System.IO.MemoryStream
    $b = $enc.GetBytes("--$boundaryC$LF" + "Content-Disposition: form-data; name=`"type`"$LF$LF" + "AUDIO$LF"); $msC.Write($b, 0, $b.Length)
    $b = $enc.GetBytes("--$boundaryC$LF" + "Content-Disposition: form-data; name=`"description`"$LF$LF" + "Repeated threatening voicemail message.$LF"); $msC.Write($b, 0, $b.Length)
    $b = $enc.GetBytes("--$boundaryC$LF" + "Content-Disposition: form-data; name=`"tags`"$LF$LF" + "STALKING,REPEATED_INCIDENT$LF"); $msC.Write($b, 0, $b.Length)
    $b = $enc.GetBytes("--$boundaryC$LF" + "Content-Disposition: form-data; name=`"file`"; filename=`"voicemail.wav`"$LF" + "Content-Type: audio/wav$LF$LF"); $msC.Write($b, 0, $b.Length)
    $msC.Write($audioBytes, 0, $audioBytes.Length)
    $b = $enc.GetBytes("$LF--$boundaryC--$LF"); $msC.Write($b, 0, $b.Length)
    $bytesC = $msC.ToArray(); $msC.Dispose()
    $headersC = @{ "Authorization" = "Bearer $victimToken"; "Content-Type" = "multipart/form-data; boundary=$boundaryC" }
    $audioRes = Invoke-RestMethod -Uri "$baseUrl/cases/evidence" -Method Post -Body $bytesC -Headers $headersC
    Write-Host "[PASS] 3c. Upload Audio Evidence: PASSED"

    $results["3_UploadEvidence"] = "PASSED - Uploaded TEXT, IMAGE, AUDIO (Severity Score: $($audioRes.caseSeverityScore), Tier: $($audioRes.caseSeverityLevel))"
} catch {
    $results["3_UploadEvidence"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 3. Upload Evidence: FAILED - $($_.Exception.Message)"
}

# ---------------------------------------------------------------
# Step 4: Authority Login & Queue Inspection
# ---------------------------------------------------------------
$authorityToken = $null
try {
    $authLoginBody = @{ username = "authority1"; password = "demo123" } | ConvertTo-Json
    $authLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $authLoginBody -ContentType "application/json"
    $authorityToken = $authLoginRes.token

    $queueRes = Invoke-RestMethod -Uri "$baseUrl/authority/cases" -Method Get -Headers @{ "Authorization" = "Bearer $authorityToken" }
    if ($queueRes.Count -ge 1) {
        $results["4_AuthorityQueue"] = "PASSED - Retrieved $($queueRes.Count) case(s) from authority investigation queue"
        Write-Host "[PASS] 4. Authority Queue: PASSED"
    } else {
        $results["4_AuthorityQueue"] = "FAILED - Queue empty"
        Write-Host "[FAIL] 4. Authority Queue: FAILED"
    }
} catch {
    $results["4_AuthorityQueue"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 4. Authority Queue: FAILED - $($_.Exception.Message)"
}

# ---------------------------------------------------------------
# Step 5: Authority Requests Access for victim1 Case
# ---------------------------------------------------------------
$reqId1 = $null
try {
    $reqBody = @{ reason = "Official cyber crime division investigation" } | ConvertTo-Json
    $reqRes = Invoke-RestMethod -Uri "$baseUrl/authority/cases/$victimCaseId/request-access" -Method Post -Body $reqBody -Headers @{ "Authorization" = "Bearer $authorityToken" } -ContentType "application/json"
    $reqId1 = $reqRes.requestId
    if ($reqId1 -and $reqRes.status -eq "PENDING") {
        $results["5_AuthorityRequest"] = "PASSED - Request created (ID: $reqId1, Status: PENDING)"
        Write-Host "[PASS] 5. Authority Request: PASSED"
    } else {
        $results["5_AuthorityRequest"] = "FAILED"
        Write-Host "[FAIL] 5. Authority Request: FAILED"
    }
} catch {
    $results["5_AuthorityRequest"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 5. Authority Request: FAILED - $($_.Exception.Message)"
}

# ---------------------------------------------------------------
# Step 6: Victim Approval
# ---------------------------------------------------------------
try {
    $respondBody = @{ approve = $true } | ConvertTo-Json
    $respondRes = Invoke-RestMethod -Uri "$baseUrl/cases/requests/$reqId1/respond" -Method Post -Body $respondBody -Headers @{ "Authorization" = "Bearer $victimToken" } -ContentType "application/json"
    if ($respondRes.status -eq "APPROVED" -and $respondRes.accessGranted -eq $true) {
        $results["6_VictimApproval"] = "PASSED - Request approved by victim, AccessGranted=true"
        Write-Host "[PASS] 6. Victim Approval: PASSED"
    } else {
        $results["6_VictimApproval"] = "FAILED - Status=$($respondRes.status)"
        Write-Host "[FAIL] 6. Victim Approval: FAILED"
    }
} catch {
    $results["6_VictimApproval"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 6. Victim Approval: FAILED - $($_.Exception.Message)"
}

# ---------------------------------------------------------------
# Step 7: Guardian Escalation & Approval Flow (Tested on second case)
# ---------------------------------------------------------------
try {
    # 7a. Sunita (registered victim from Step 1) uploads evidence and marks self unavailable
    $boundaryReg = [System.Guid]::NewGuid().ToString()
    $bodyReg = @(
        "--$boundaryReg", 'Content-Disposition: form-data; name="type"', '', 'TEXT',
        "--$boundaryReg", 'Content-Disposition: form-data; name="description"', '', 'Harassment log',
        "--$boundaryReg", 'Content-Disposition: form-data; name="text"', '', 'Witnessed harassment statement.',
        "--$boundaryReg", 'Content-Disposition: form-data; name="tags"', '', 'HARASSMENT',
        "--$boundaryReg--"
    ) -join $LF
    $headersReg = @{ "Authorization" = "Bearer $regToken"; "Content-Type" = "multipart/form-data; boundary=$boundaryReg" }
    $regEvidenceRes = Invoke-RestMethod -Uri "$baseUrl/cases/evidence" -Method Post -Body $bodyReg -Headers $headersReg
    $regCaseId = $regEvidenceRes.caseId

    # Mark Sunita unavailable to trigger immediate guardian escalation
    Invoke-RestMethod -Uri "$baseUrl/auth/toggle-availability" -Method Post -Body "{}" -Headers @{ "Authorization" = "Bearer $regToken" } -ContentType "application/json" | Out-Null

    # 7b. Authority requests access for Sunita's case
    $gReqBody = @{ reason = "Legal aid emergency review" } | ConvertTo-Json
    $gReqRes = Invoke-RestMethod -Uri "$baseUrl/authority/cases/$regCaseId/request-access" -Method Post -Body $gReqBody -Headers @{ "Authorization" = "Bearer $authorityToken" } -ContentType "application/json"
    $gReqId = $gReqRes.requestId

    # 7c. Guardian login
    $guardianLoginBody = @{ username = "guardian1"; password = "demo123" } | ConvertTo-Json
    $guardianLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $guardianLoginBody -ContentType "application/json"
    $guardianToken = $guardianLoginRes.token

    # 7d. Guardian approves
    $gApproveBody = @{ approve = $true } | ConvertTo-Json
    $gApproveRes = Invoke-RestMethod -Uri "$baseUrl/guardian/requests/$gReqId/respond" -Method Post -Body $gApproveBody -Headers @{ "Authorization" = "Bearer $guardianToken" } -ContentType "application/json"
    if ($gApproveRes.status -eq "APPROVED" -and $gApproveRes.approvedBy -eq "GUARDIAN") {
        $results["7_GuardianApproval"] = "PASSED - Guardian escalated request approved (ApprovedBy: GUARDIAN, AccessGranted: $($gApproveRes.accessGranted))"
        Write-Host "[PASS] 7. Guardian Approval: PASSED"
    } else {
        $results["7_GuardianApproval"] = "FAILED - Status=$($gApproveRes.status)"
        Write-Host "[FAIL] 7. Guardian Approval: FAILED"
    }
} catch {
    $results["7_GuardianApproval"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 7. Guardian Approval: FAILED - $($_.Exception.Message)"
}

# ---------------------------------------------------------------
# Step 8: Decrypt and Verify as Authority (before tamper)
# ---------------------------------------------------------------
try {
    $evidenceRes = Invoke-RestMethod -Uri "$baseUrl/authority/cases/$victimCaseId/evidence" -Method Get -Headers @{ "Authorization" = "Bearer $authorityToken" }
    $chainValid = $evidenceRes.chainValid
    $victimName = $evidenceRes.victimName
    $victimPhone = $evidenceRes.victimPhone
    $overallIntegrity = $evidenceRes.overallIntegrity
    $itemsCount = $evidenceRes.items.Count

    if ($chainValid -and ($overallIntegrity -eq "VERIFIED") -and ($victimName -eq "Priya Sharma")) {
        $results["8_DecryptAndVerify"] = "PASSED - Chain Valid: $chainValid, Overall: $overallIntegrity, Decrypted Victim: '$victimName' ($victimPhone), Items: $itemsCount"
        Write-Host "[PASS] 8. Decrypt and Verify: PASSED"
    } else {
        $results["8_DecryptAndVerify"] = "FAILED - ChainValid: $chainValid, Overall: $overallIntegrity, Name: $victimName"
        Write-Host "[FAIL] 8. Decrypt and Verify: FAILED"
    }
} catch {
    $results["8_DecryptAndVerify"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 8. Decrypt and Verify: FAILED - $($_.Exception.Message)"
}

# ---------------------------------------------------------------
# Step 9: Tamper Simulation and Tamper Detection
# ---------------------------------------------------------------
try {
    $evidenceToTamper = $audioRes.evidenceId
    $tamperRes = Invoke-RestMethod -Uri "$baseUrl/dev/tamper/$evidenceToTamper" -Method Post -Body "{}" -Headers @{ "Authorization" = "Bearer $victimToken" } -ContentType "application/json"
    
    # Re-inspect victim1 case as authority to test tamper detection
    $tamperInspectRes = Invoke-RestMethod -Uri "$baseUrl/authority/cases/$victimCaseId/evidence" -Method Get -Headers @{ "Authorization" = "Bearer $authorityToken" }
    $tamperDetected = (-not $tamperInspectRes.chainValid) -and ($tamperInspectRes.overallIntegrity -eq "TAMPERED")
    $brokenSeq = $tamperInspectRes.firstBrokenIndex + 1

    if ($tamperDetected) {
        $results["9_TamperDetection"] = "PASSED - OverallIntegrity: TAMPERED, ChainValid: false, Broken block identified: sequence #$brokenSeq"
        Write-Host "[PASS] 9. Tamper Detection: PASSED (Detected at item sequence #$brokenSeq)"
    } else {
        $results["9_TamperDetection"] = "FAILED - Tamper not detected by verification engine"
        Write-Host "[FAIL] 9. Tamper Detection: FAILED"
    }
} catch {
    $results["9_TamperDetection"] = "FAILED - $($_.Exception.Message)"
    Write-Host "[FAIL] 9. Tamper Detection: FAILED - $($_.Exception.Message)"
}

Write-Host ""
Write-Host "===================================================="
Write-Host "Summary of Flow Execution:"
Write-Host "===================================================="
$results.GetEnumerator() | ForEach-Object {
    Write-Host "$($_.Key): $($_.Value)"
}
Write-Host "===================================================="
