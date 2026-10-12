package com.shadowvault.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.util.Random;

@Service
public class StegoService {

    @Value("${shadowvault.storage.path:./data/storage}")
    private String storagePath;

    public File embedAndSave(byte[] payload, byte[] keyMaterial, String fileNamePrefix) throws IOException {
        File dir = new File(storagePath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        BufferedImage carrier = createCarrierImage(payload.length);
        embedPayload(carrier, payload, keyMaterial);

        File outputFile = new File(dir, fileNamePrefix + ".png");
        ImageIO.write(carrier, "PNG", outputFile);
        return outputFile;
    }

    public byte[] extractPayloadFromFile(File stegoFile, byte[] keyMaterial) throws IOException {
        BufferedImage image = ImageIO.read(stegoFile);
        if (image == null) {
            throw new IOException("Failed to read stego PNG image from: " + stegoFile.getAbsolutePath());
        }
        return extractPayload(image, keyMaterial);
    }

    public BufferedImage createCarrierImage(int payloadByteLength) {
        int totalBitsNeeded = (payloadByteLength + 4) * 8;
        int pixelsNeeded = (int) Math.ceil(totalBitsNeeded / 3.0);
        int dim = Math.max(250, (int) Math.ceil(Math.sqrt(pixelsNeeded * 1.5)));

        BufferedImage img = new BufferedImage(dim, dim, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();

        // High quality aesthetic nature gradient carrier
        GradientPaint gradient = new GradientPaint(
                0, 0, new Color(18, 24, 38),
                dim, dim, new Color(42, 60, 90)
        );
        g.setPaint(gradient);
        g.fillRect(0, 0, dim, dim);

        // Add subtle procedural organic waves to make it look completely natural
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        for (int i = 0; i < 6; i++) {
            g.setColor(new Color(60 + i * 15, 80 + i * 12, 110 + i * 18, 40));
            g.fillOval(dim / 4 + i * 15, dim / 3 + i * 20, dim / 2, dim / 3);
        }
        g.dispose();
        return img;
    }

    public void embedPayload(BufferedImage image, byte[] payload, byte[] keyMaterial) {
        int totalBits = (payload.length + 4) * 8;
        int width = image.getWidth();
        int height = image.getHeight();
        int totalSlots = width * height * 3;

        if (totalBits > totalSlots) {
            throw new IllegalArgumentException("Payload size " + payload.length + " bytes exceeds carrier capacity of " + totalSlots / 8 + " bytes");
        }

        int[] slots = generateShuffledSlots(totalSlots, totalBits, keyMaterial);

        // Prepare bits array: 32 bits length header + payload bits
        byte[] bits = new byte[totalBits];
        int len = payload.length;
        for (int i = 0; i < 32; i++) {
            bits[i] = (byte) ((len >>> (31 - i)) & 1);
        }

        int bitIdx = 32;
        for (byte b : payload) {
            for (int j = 7; j >= 0; j--) {
                bits[bitIdx++] = (byte) ((b >>> j) & 1);
            }
        }

        // Embed each bit into shuffled channel LSB
        for (int i = 0; i < totalBits; i++) {
            int slot = slots[i];
            int pixelIdx = slot / 3;
            int channel = slot % 3; // 0=R, 1=G, 2=B
            int x = pixelIdx % width;
            int y = pixelIdx / width;

            int rgb = image.getRGB(x, y);
            int bit = bits[i];

            if (channel == 0) {
                rgb = (rgb & ~0x00010000) | (bit << 16);
            } else if (channel == 1) {
                rgb = (rgb & ~0x00000100) | (bit << 8);
            } else {
                rgb = (rgb & ~0x00000001) | bit;
            }
            image.setRGB(x, y, rgb);
        }
    }

    public byte[] extractPayload(BufferedImage image, byte[] keyMaterial) {
        int width = image.getWidth();
        int height = image.getHeight();
        int totalSlots = width * height * 3;

        // First read 32 bits for payload length
        int[] headerSlots = generateShuffledSlots(totalSlots, 32, keyMaterial);
        int length = 0;
        for (int i = 0; i < 32; i++) {
            int slot = headerSlots[i];
            int pixelIdx = slot / 3;
            int channel = slot % 3;
            int x = pixelIdx % width;
            int y = pixelIdx / width;
            int rgb = image.getRGB(x, y);

            int bit;
            if (channel == 0) {
                bit = (rgb >> 16) & 1;
            } else if (channel == 1) {
                bit = (rgb >> 8) & 1;
            } else {
                bit = rgb & 1;
            }
            length = (length << 1) | bit;
        }

        if (length < 0 || (length + 4) * 8 > totalSlots) {
            throw new IllegalArgumentException("Corrupted stego header or invalid key: decoded payload length=" + length);
        }

        int totalBits = (length + 4) * 8;
        int[] allSlots = generateShuffledSlots(totalSlots, totalBits, keyMaterial);

        byte[] payload = new byte[length];
        int bitPos = 0;
        byte currentByte = 0;

        for (int i = 32; i < totalBits; i++) {
            int slot = allSlots[i];
            int pixelIdx = slot / 3;
            int channel = slot % 3;
            int x = pixelIdx % width;
            int y = pixelIdx / width;
            int rgb = image.getRGB(x, y);

            int bit;
            if (channel == 0) {
                bit = (rgb >> 16) & 1;
            } else if (channel == 1) {
                bit = (rgb >> 8) & 1;
            } else {
                bit = rgb & 1;
            }

            currentByte = (byte) ((currentByte << 1) | bit);
            bitPos++;
            if (bitPos == 8) {
                payload[(i - 32) / 8] = currentByte;
                bitPos = 0;
                currentByte = 0;
            }
        }

        return payload;
    }

    private int[] generateShuffledSlots(int totalSlots, int slotsNeeded, byte[] keyMaterial) {
        long seed = deriveSeed(keyMaterial);
        Random random = new Random(seed);

        // Pre-allocate slots array and perform Fisher-Yates shuffle for slotsNeeded elements
        int[] slots = new int[totalSlots];
        for (int i = 0; i < totalSlots; i++) {
            slots[i] = i;
        }

        int count = Math.min(slotsNeeded, totalSlots);
        for (int i = 0; i < count; i++) {
            int swapIdx = i + random.nextInt(totalSlots - i);
            int temp = slots[i];
            slots[i] = slots[swapIdx];
            slots[swapIdx] = temp;
        }

        int[] result = new int[count];
        System.arraycopy(slots, 0, result, 0, count);
        return result;
    }

    private long deriveSeed(byte[] keyMaterial) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(keyMaterial);
            return ByteBuffer.wrap(hash).getLong();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 error deriving seed", e);
        }
    }
}
