package com.shadowvault;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DevEndpointProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Verify /api/dev/tamper/{id} returns 404 in default profile")
    void devTamperEndpointReturns404InDefaultProfile() throws Exception {
        mockMvc.perform(post("/api/dev/tamper/1"))
                .andExpect(status().isNotFound());
    }
}
