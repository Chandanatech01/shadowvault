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
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers(disabledWithoutDocker = true)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ShadowVaultIntegrationTest {

    @Container
    static MySQLContainer<?> mysqlContainer = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("shadowvault_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (mysqlContainer.isRunning()) {
            registry.add("spring.datasource.url", mysqlContainer::getJdbcUrl);
            registry.add("spring.datasource.username", mysqlContainer::getUsername);
            registry.add("spring.datasource.password", mysqlContainer::getPassword);
            registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
            registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.MySQLDialect");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String victimToken;
    private static String authorityToken;
    private static String guardianToken;
    private static String caseId;
    private static Long evidenceId;
    private static Long accessRequestId;

    @Test
    @Order(1)
    @DisplayName("1. User Registration and Login for all roles")
    void testRegistrationAndLogin() throws Exception {
        // Register new victim
        Map<String, String> regBody = Map.of(
                "fullName", "Integration Test Victim",
                "phone", "+91 99999 11111",
                "email", "integ_victim@test.org",
                "username", "integ_victim",
                "password", "demo123",
                "guardianName", "Integ Guardian",
                "guardianPhone", "+91 99999 22222",
                "guardianUsername", "guardian1"
        );

        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regBody)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode regNode = objectMapper.readTree(regRes.getResponse().getContentAsString());
        assertNotNull(regNode.get("token"));
        assertEquals("integ_victim", regNode.get("user").get("username").asText());
        assertEquals("ROLE_VICTIM", regNode.get("user").get("role").asText());
        assertNotNull(regNode.get("simulatedOtp"));

        // Login as newly created victim
        Map<String, String> loginBody = Map.of("username", "integ_victim", "password", "demo123");
        MvcResult loginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginNode = objectMapper.readTree(loginRes.getResponse().getContentAsString());
        victimToken = loginNode.get("token").asText();
        assertNotNull(victimToken);

        // Login as seeded authority
        Map<String, String> authLogin = Map.of("username", "authority1", "password", "demo123");
        MvcResult authRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authLogin)))
                .andExpect(status().isOk())
                .andReturn();
        authorityToken = objectMapper.readTree(authRes.getResponse().getContentAsString()).get("token").asText();

        // Login as seeded guardian
        Map<String, String> guardLogin = Map.of("username", "guardian1", "password", "demo123");
        MvcResult guardRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(guardLogin)))
                .andExpect(status().isOk())
                .andReturn();
        guardianToken = objectMapper.readTree(guardRes.getResponse().getContentAsString()).get("token").asText();
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
        assertNull(targetCase.get("victimName")); // Masked before approval!

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
    @Order(4)
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
    @Order(5)
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
        assertEquals("Integration Test Victim", reportNode.get("victimName").asText()); // Unmasked after approval
        assertEquals("+91 99999 11111", reportNode.get("victimPhone").asText());

        JsonNode items = reportNode.get("items");
        assertEquals(2, items.size());
        assertTrue(items.get(0).get("verified").asBoolean());
        assertTrue(items.get(1).get("verified").asBoolean());
    }

    @Test
    @Order(6)
    @DisplayName("6. Guardian Escalation Flow when Victim is Unavailable")
    void testGuardianEscalation() throws Exception {
        // 1. Register a ward victim who designates guardian1
        Map<String, String> escReg = Map.of(
                "fullName", "Escalation Victim",
                "phone", "+91 99999 55555",
                "email", "esc_victim@test.org",
                "username", "esc_victim",
                "password", "demo123",
                "guardianName", "Anita Guardian",
                "guardianPhone", "+91 99999 66666",
                "guardianUsername", "guardian1"
        );
        MvcResult escRegRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(escReg)))
                .andExpect(status().isOk())
                .andReturn();
        String escVictimToken = objectMapper.readTree(escRegRes.getResponse().getContentAsString()).get("token").asText();

        // 2. Ward marks self as UNAVAILABLE
        mockMvc.perform(post("/api/auth/toggle-availability")
                        .header("Authorization", "Bearer " + escVictimToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unavailable").value(true));

        // 3. Ward submits evidence to create an active case
        MvcResult uploadRes = mockMvc.perform(multipart("/api/cases/evidence")
                        .param("type", "TEXT")
                        .param("description", "Escalation test statement")
                        .param("text", "Emergency report by unavailable ward")
                        .header("Authorization", "Bearer " + escVictimToken))
                .andExpect(status().isOk())
                .andReturn();
        String c2Id = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("caseId").asText();

        // 4. Authority requests access to ward's case
        MvcResult req2Res = mockMvc.perform(post("/api/authority/cases/" + c2Id + "/request-access")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Urgent escalation review")))
                        .header("Authorization", "Bearer " + authorityToken))
                .andExpect(status().isOk())
                .andReturn();
        Long req2Id = objectMapper.readTree(req2Res.getResponse().getContentAsString()).get("id").asLong();

        // 5. Guardian checks pending requests for their ward
        MvcResult guardReqsRes = mockMvc.perform(get("/api/guardian/requests")
                        .header("Authorization", "Bearer " + guardianToken))
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
        assertNotNull(targetReq, "Guardian must see ward's pending request");
        assertTrue(targetReq.get("victimUnavailable").asBoolean());
        assertTrue(targetReq.get("canApprove").asBoolean());

        // 6. Guardian approves access
        mockMvc.perform(post("/api/guardian/requests/" + req2Id + "/respond")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("approve", true)))
                        .header("Authorization", "Bearer " + guardianToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // 7. Authority can now view the unlocked evidence
        mockMvc.perform(get("/api/authority/cases/" + c2Id + "/evidence")
                        .header("Authorization", "Bearer " + authorityToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chainValid").value(true));
    }

    @Test
    @Order(7)
    @DisplayName("7. Tamper Detection and Compromised Chain Identification")
    void testTamperDetection() throws Exception {
        // Tamper with the latest item of our primary case using dev endpoint
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
