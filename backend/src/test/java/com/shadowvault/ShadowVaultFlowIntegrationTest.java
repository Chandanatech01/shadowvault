package com.shadowvault;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ShadowVaultFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String victimToken;
    private static String authorityToken;
    private static String guardianToken;
    private static String victimInviteCode;
    private static String caseId;
    private static Long evidenceId;
    private static Long accessRequestId;

    @Test
    @Order(1)
    @DisplayName("1. User Registration, Validations, Guardian Linking and Login for all roles")
    void testRegistrationAndLogin() throws Exception {
        // 1a. Register new victim
        Map<String, String> regVictimBody = Map.of(
                "role", "VICTIM",
                "fullName", "Flow Test Victim",
                "phone", "+91 99999 33333",
                "email", "flow_victim@test.org",
                "username", "flow_victim",
                "password", "Password123!",
                "guardianName", "Flow Guardian",
                "guardianPhone", "+91 99999 44444"
        );

        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regVictimBody)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode regNode = objectMapper.readTree(regRes.getResponse().getContentAsString());
        assertNotNull(regNode.get("token"));
        assertEquals("flow_victim", regNode.get("user").get("username").asText());
        assertEquals("ROLE_VICTIM", regNode.get("user").get("role").asText());
        assertNotNull(regNode.get("simulatedOtp"));
        assertNotNull(regNode.get("guardianInviteCode"));
        victimInviteCode = regNode.get("guardianInviteCode").asText();
        assertTrue(victimInviteCode.startsWith("GRD-"), "Invite code should start with GRD-");

        // 1b. Test validation failure: short password (< 8 chars)
        Map<String, String> shortPwBody = Map.of(
                "role", "VICTIM",
                "fullName", "Invalid Victim",
                "phone", "+91 99999 12345",
                "email", "short_pw@test.org",
                "username", "short_pw_user",
                "password", "short"
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortPwBody)))
                .andExpect(status().isBadRequest());

        // 1c. Test validation failure: duplicate username
        Map<String, String> dupUserBody = Map.of(
                "role", "VICTIM",
                "fullName", "Duplicate Victim",
                "phone", "+91 99999 12345",
                "email", "dup_user@test.org",
                "username", "flow_victim",
                "password", "Password123!"
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupUserBody)))
                .andExpect(status().isBadRequest());

        // 1d. Test validation failure: guardian with invalid invite code
        Map<String, String> badInviteGuardBody = Map.of(
                "role", "GUARDIAN",
                "fullName", "Fake Guardian",
                "phone", "+91 99999 77777",
                "email", "bad_guard@test.org",
                "username", "bad_guard",
                "password", "Password123!",
                "guardianInviteCode", "GRD-INVALID99"
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badInviteGuardBody)))
                .andExpect(status().isBadRequest());

        // 1e. Test validation failure: authority with invalid access code
        Map<String, String> badAuthBody = Map.of(
                "role", "AUTHORITY",
                "fullName", "Fake Authority",
                "phone", "+91 99999 88888",
                "email", "bad_auth@test.org",
                "username", "bad_auth",
                "password", "Password123!",
                "department", "Impostor Unit",
                "authorityAccessCode", "WRONG-CODE-999"
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badAuthBody)))
                .andExpect(status().isBadRequest());

        // 1f. Register Guardian linked to victim using real invite code
        Map<String, String> regGuardBody = Map.of(
                "role", "GUARDIAN",
                "fullName", "Flow Guardian",
                "phone", "+91 99999 44444",
                "email", "flow_guardian@test.org",
                "username", "flow_guardian",
                "password", "Password123!",
                "guardianInviteCode", victimInviteCode
        );
        MvcResult guardRegRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regGuardBody)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode guardRegNode = objectMapper.readTree(guardRegRes.getResponse().getContentAsString());
        assertEquals("ROLE_GUARDIAN", guardRegNode.get("user").get("role").asText());
        assertEquals("flow_victim", guardRegNode.get("linkedVictim").asText());

        // 1g. Register Authority using valid access code (AUTH-2026)
        Map<String, String> regAuthBody = Map.of(
                "role", "AUTHORITY",
                "fullName", "Officer Rajesh Verma",
                "phone", "+91 98111 22334",
                "email", "flow_authority@test.org",
                "username", "flow_authority",
                "password", "Password123!",
                "department", "Cyber Crime Division",
                "authorityAccessCode", "AUTH-2026"
        );
        MvcResult authRegRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regAuthBody)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode authRegNode = objectMapper.readTree(authRegRes.getResponse().getContentAsString());
        assertEquals("ROLE_AUTHORITY", authRegNode.get("user").get("role").asText());
        assertEquals("Cyber Crime Division", authRegNode.get("user").get("department").asText());

        // 1h. Login as newly created Victim
        Map<String, String> victimLogin = Map.of("username", "flow_victim", "password", "Password123!");
        MvcResult victimLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(victimLogin)))
                .andExpect(status().isOk())
                .andReturn();
        victimToken = objectMapper.readTree(victimLoginRes.getResponse().getContentAsString()).get("token").asText();
        assertNotNull(victimToken);

        // 1i. Login as newly created Guardian
        Map<String, String> guardLogin = Map.of("username", "flow_guardian", "password", "Password123!");
        MvcResult guardLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(guardLogin)))
                .andExpect(status().isOk())
                .andReturn();
        guardianToken = objectMapper.readTree(guardLoginRes.getResponse().getContentAsString()).get("token").asText();
        assertNotNull(guardianToken);

        // 1j. Login as newly created Authority
        Map<String, String> authLogin = Map.of("username", "flow_authority", "password", "Password123!");
        MvcResult authLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authLogin)))
                .andExpect(status().isOk())
                .andReturn();
        authorityToken = objectMapper.readTree(authLoginRes.getResponse().getContentAsString()).get("token").asText();
        assertNotNull(authorityToken);
    }

    @Test
    @Order(2)
    @DisplayName("2. Evidence Upload with Dynamic Severity and Hash Chain Linkage")
    void testEvidenceUploadAndHashChain() throws Exception {
        // Upload text statement
        MvcResult uploadRes1 = mockMvc.perform(multipart("/api/cases/evidence")
                        .param("type", "TEXT")
                        .param("description", "Suspect harassed victim near premises")
                        .param("text", "Full testimony: Threatening messages received on mobile device")
                        .param("tags", "THREAT,HARASSMENT")
                        .header("Authorization", "Bearer " + victimToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode item1Node = objectMapper.readTree(uploadRes1.getResponse().getContentAsString());
        caseId = item1Node.get("caseId").asText();
        evidenceId = item1Node.get("id").asLong();
        assertEquals(1, item1Node.get("sequenceNumber").asInt());
        assertNotNull(item1Node.get("prevChainHash").asText());
        assertTrue(item1Node.get("caseSeverityScore").asInt() > 0);

        // Upload second item (image) to build the hash chain
        byte[] dummyPng = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        MockMultipartFile imgFile = new MockMultipartFile("file", "evidence.png", "image/png", dummyPng);

        MvcResult uploadRes2 = mockMvc.perform(multipart("/api/cases/evidence")
                        .file(imgFile)
                        .param("type", "IMAGE")
                        .param("description", "Photo of physical damage")
                        .param("tags", "PHYSICAL_HARM,REPEATED_INCIDENT")
                        .header("Authorization", "Bearer " + victimToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode item2Node = objectMapper.readTree(uploadRes2.getResponse().getContentAsString());
        assertEquals(2, item2Node.get("sequenceNumber").asInt());
        assertEquals(item1Node.get("chainHash").asText(), item2Node.get("prevChainHash").asText());
    }

    @Test
    @Order(3)
    @DisplayName("2b. Stego Download and Decrypt Round Trip with Victim Password")
    void testStegoDownloadAndDecryptRoundTrip() throws Exception {
        // 1. Download stego PNG as owner victim
        MvcResult stegoRes = mockMvc.perform(get("/api/cases/evidence/" + evidenceId + "/stego")
                        .header("Authorization", "Bearer " + victimToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"photo_" + evidenceId + ".png\""))
                .andReturn();

        byte[] downloadedPng = stegoRes.getResponse().getContentAsByteArray();
        assertTrue(downloadedPng.length > 100);

        // 2. Non-owner / unauthorized access returns 404
        mockMvc.perform(get("/api/cases/evidence/" + evidenceId + "/stego")
                        .header("Authorization", "Bearer " + authorityToken))
                .andExpect(status().isNotFound());

        // 3. Decrypt with wrong password returns 401
        Map<String, String> wrongPassBody = Map.of("password", "WrongPassword123!");
        mockMvc.perform(post("/api/cases/evidence/" + evidenceId + "/decrypt")
                        .header("Authorization", "Bearer " + victimToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPassBody)))
                .andExpect(status().isUnauthorized());

        // 4. Decrypt with correct victim password returns original text & verified integrity
        Map<String, String> correctPassBody = Map.of("password", "Password123!");
        MvcResult decryptRes = mockMvc.perform(post("/api/cases/evidence/" + evidenceId + "/decrypt")
                        .header("Authorization", "Bearer " + victimToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctPassBody)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode decNode = objectMapper.readTree(decryptRes.getResponse().getContentAsString());
        assertTrue(decNode.get("verified").asBoolean());
        assertEquals("TEXT", decNode.get("evidenceType").asText());
        assertEquals("Full testimony: Threatening messages received on mobile device", decNode.get("textData").asText());
    }

    @Test
    @Order(4)
    @DisplayName("3. Authority Queue and Identity Masking")
    void testAuthorityQueueAndAccessRequest() throws Exception {
        // Authority lists cases
        MvcResult casesRes = mockMvc.perform(get("/api/authority/cases")
                        .header("Authorization", "Bearer " + authorityToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode casesNode = objectMapper.readTree(casesRes.getResponse().getContentAsString());
        assertTrue(casesNode.isArray());
        assertTrue(casesNode.size() > 0);

        // Find our case and verify masked identity
        JsonNode targetCase = null;
        for (JsonNode c : casesNode) {
            if (c.get("caseId").asText().equals(caseId)) {
                targetCase = c;
                break;
            }
        }
        assertNotNull(targetCase, "Uploaded case must be visible to authority");
        assertFalse(targetCase.get("accessGranted").asBoolean());
        assertNull(targetCase.get("victimName")); // Masked before approval

        // Authority submits access request
        Map<String, String> reqBody = Map.of("reason", "Official cybercrime division investigation");
        MvcResult reqRes = mockMvc.perform(post("/api/authority/cases/" + caseId + "/request-access")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqBody))
                        .header("Authorization", "Bearer " + authorityToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode reqNode = objectMapper.readTree(reqRes.getResponse().getContentAsString());
        assertEquals("PENDING", reqNode.get("status").asText());
        accessRequestId = reqNode.get("id").asLong();
    }

    @Test
    @Order(5)
    @DisplayName("4. Victim Review and Approval of Access Request")
    void testVictimApproval() throws Exception {
        // Victim views pending requests on their case
        MvcResult myCaseRes = mockMvc.perform(get("/api/cases/my")
                        .header("Authorization", "Bearer " + victimToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode myCaseNode = objectMapper.readTree(myCaseRes.getResponse().getContentAsString());
        JsonNode requests = myCaseNode.get("requests");
        assertNotNull(requests);
        assertTrue(requests.size() > 0);

        // Victim approves access
        Map<String, Object> respondBody = Map.of("approve", true);
        mockMvc.perform(post("/api/cases/requests/" + accessRequestId + "/respond")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(respondBody))
                        .header("Authorization", "Bearer " + victimToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @Order(6)
    @DisplayName("5. Authority Decrypt and Verify Evidence Chain (VERIFIED Status)")
    void testAuthorityDecryptAndVerify() throws Exception {
        // Authority views decrypted evidence dossier
        MvcResult evidenceRes = mockMvc.perform(get("/api/authority/cases/" + caseId + "/evidence")
                        .header("Authorization", "Bearer " + authorityToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode reportNode = objectMapper.readTree(evidenceRes.getResponse().getContentAsString());
        assertEquals("VERIFIED", reportNode.get("overallIntegrity").asText());
        assertTrue(reportNode.get("chainValid").asBoolean());
        assertEquals("Flow Test Victim", reportNode.get("victimName").asText()); // Unmasked after approval
        assertEquals("+91 99999 33333", reportNode.get("victimPhone").asText());

        JsonNode items = reportNode.get("items");
        assertEquals(2, items.size());
        assertTrue(items.get(0).get("verified").asBoolean());
        assertTrue(items.get(1).get("verified").asBoolean());
    }

    @Test
    @Order(7)
    @DisplayName("6. Guardian Escalation Flow when Victim is Unavailable and Real Linking Check")
    void testGuardianEscalation() throws Exception {
        // 1. Register a ward victim who gets their own invite code
        Map<String, String> escReg = Map.of(
                "role", "VICTIM",
                "fullName", "Escalation Victim",
                "phone", "+91 99999 55555",
                "email", "esc_victim@test.org",
                "username", "esc_victim",
                "password", "Password123!"
        );
        MvcResult escRegRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(escReg)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode escNode = objectMapper.readTree(escRegRes.getResponse().getContentAsString());
        String escVictimToken = escNode.get("token").asText();
        String escInviteCode = escNode.get("guardianInviteCode").asText();

        // 2. Register guardian linked to this ward via invite code
        Map<String, String> escGuardReg = Map.of(
                "role", "GUARDIAN",
                "fullName", "Anita Guardian",
                "phone", "+91 99999 66666",
                "email", "esc_guardian@test.org",
                "username", "esc_guardian",
                "password", "Password123!",
                "guardianInviteCode", escInviteCode
        );
        MvcResult escGuardRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(escGuardReg)))
                .andExpect(status().isOk())
                .andReturn();
        String escGuardianToken = objectMapper.readTree(escGuardRes.getResponse().getContentAsString()).get("token").asText();

        // 3. Register an unlinked guardian (linked to flow_victim, not esc_victim)
        Map<String, String> unlinkedGuardReg = Map.of(
                "role", "GUARDIAN",
                "fullName", "Other Guardian",
                "phone", "+91 99999 77889",
                "email", "other_guardian@test.org",
                "username", "other_guardian",
                "password", "Password123!",
                "guardianInviteCode", victimInviteCode
        );
        MvcResult otherGuardRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unlinkedGuardReg)))
                .andExpect(status().isOk())
                .andReturn();
        String unlinkedGuardianToken = objectMapper.readTree(otherGuardRes.getResponse().getContentAsString()).get("token").asText();

        // 4. Ward marks self as UNAVAILABLE
        mockMvc.perform(post("/api/auth/toggle-availability")
                        .header("Authorization", "Bearer " + escVictimToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unavailable").value(true));

        // 5. Ward submits evidence to create an active case
        MvcResult uploadRes = mockMvc.perform(multipart("/api/cases/evidence")
                        .param("type", "TEXT")
                        .param("description", "Escalation test statement")
                        .param("text", "Emergency report by unavailable ward")
                        .header("Authorization", "Bearer " + escVictimToken))
                .andExpect(status().isOk())
                .andReturn();
        String c2Id = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("caseId").asText();

        // 6. Authority requests access to ward's case
        MvcResult req2Res = mockMvc.perform(post("/api/authority/cases/" + c2Id + "/request-access")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Urgent escalation review")))
                        .header("Authorization", "Bearer " + authorityToken))
                .andExpect(status().isOk())
                .andReturn();
        Long req2Id = objectMapper.readTree(req2Res.getResponse().getContentAsString()).get("id").asLong();

        // 7. Unlinked guardian checks pending requests - should NOT see this request!
        MvcResult otherReqsRes = mockMvc.perform(get("/api/guardian/requests")
                        .header("Authorization", "Bearer " + unlinkedGuardianToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode otherReqs = objectMapper.readTree(otherReqsRes.getResponse().getContentAsString());
        for (JsonNode r : otherReqs) {
            assertNotEquals(req2Id, r.get("id").asLong(), "Unlinked guardian must not see request for unlinked ward");
        }

        // 8. Unlinked guardian attempts to approve - should be REJECTED (HTTP 400)
        mockMvc.perform(post("/api/guardian/requests/" + req2Id + "/respond")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("approve", true)))
                        .header("Authorization", "Bearer " + unlinkedGuardianToken))
                .andExpect(status().isBadRequest());

        // 9. Linked guardian checks pending requests for their ward - must see it!
        MvcResult guardReqsRes = mockMvc.perform(get("/api/guardian/requests")
                        .header("Authorization", "Bearer " + escGuardianToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode guardReqs = objectMapper.readTree(guardReqsRes.getResponse().getContentAsString());
        assertTrue(guardReqs.size() > 0);

        JsonNode targetReq = null;
        for (JsonNode r : guardReqs) {
            if (r.get("id").asLong() == req2Id) {
                targetReq = r;
                break;
            }
        }
        assertNotNull(targetReq, "Linked guardian must see ward's pending request");
        assertTrue(targetReq.get("victimUnavailable").asBoolean());
        assertTrue(targetReq.get("canApprove").asBoolean());

        // 10. Linked guardian approves access
        mockMvc.perform(post("/api/guardian/requests/" + req2Id + "/respond")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("approve", true)))
                        .header("Authorization", "Bearer " + escGuardianToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // 11. Authority can now view the unlocked evidence
        mockMvc.perform(get("/api/authority/cases/" + c2Id + "/evidence")
                        .header("Authorization", "Bearer " + authorityToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chainValid").value(true));
    }

    @Test
    @Order(8)
    @DisplayName("7. Tamper Detection and Compromised Chain Identification")
    void testTamperDetection() throws Exception {
        // Tamper with our primary case using dev endpoint
        MvcResult tamperRes = mockMvc.perform(post("/api/dev/tamper/" + evidenceId))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode tamperNode = objectMapper.readTree(tamperRes.getResponse().getContentAsString());
        assertTrue(tamperNode.get("success").asBoolean());

        // Authority checks evidence - chain must be flagged as TAMPERED
        MvcResult verifyRes = mockMvc.perform(get("/api/authority/cases/" + caseId + "/evidence")
                        .header("Authorization", "Bearer " + authorityToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode verifyNode = objectMapper.readTree(verifyRes.getResponse().getContentAsString());
        assertEquals("TAMPERED", verifyNode.get("overallIntegrity").asText());
        assertFalse(verifyNode.get("chainValid").asBoolean());
        assertEquals(0, verifyNode.get("firstBrokenIndex").asInt());
        assertEquals(evidenceId, verifyNode.get("firstBrokenId").asLong());
    }
}
