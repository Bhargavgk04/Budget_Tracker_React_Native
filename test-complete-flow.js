const readline = require("readline");

const API_URL = "https://budget-tracker-react-native-kjff.onrender.com/api";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function testCompleteFlow() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     FORGOT PASSWORD - COMPLETE FLOW TEST              ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  try {
    // Get email from user
    const email = await question(
      "Enter your email (or press Enter for bhargavkatkam0@gmail.com): "
    );
    const testEmail = email.trim() || "bhargavkatkam0@gmail.com";

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 1: Sending OTP to", testEmail);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Step 1: Send OTP
    const otpResponse = await fetch(`${API_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });

    if (!otpResponse.ok) {
      console.error("❌ Failed to send OTP");
      console.error("Status:", otpResponse.status, otpResponse.statusText);

      if (otpResponse.status === 502) {
        console.log("\n⚠️  Backend is sleeping. Run this first:");
        console.log("   node wake-backend.js");
      }
      rl.close();
      return;
    }

    const otpData = await otpResponse.json();
    console.log("✅ OTP sent successfully!");

    if (otpData.otp) {
      console.log("\n📧 OTP Code (development mode):", otpData.otp);
    } else {
      console.log("\n📧 Check your email for the OTP code");
    }

    // Get OTP from user
    const otp = await question("\nEnter the 6-digit OTP: ");

    if (otp.trim().length !== 6) {
      console.error("❌ OTP must be 6 digits");
      rl.close();
      return;
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 2: Verifying OTP");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Step 2: Verify OTP
    const verifyResponse = await fetch(`${API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: otp.trim() }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      console.error(
        "❌ OTP verification failed:",
        errorData.error || "Invalid OTP"
      );
      rl.close();
      return;
    }

    console.log("✅ OTP verified successfully!");

    // Get new password
    const newPassword = await question(
      "\nEnter new password (min 8 chars, mixed case, number, special char): "
    );

    if (newPassword.trim().length < 8) {
      console.error("❌ Password must be at least 8 characters");
      rl.close();
      return;
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 3: Resetting Password");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Step 3: Reset Password
    const resetResponse = await fetch(`${API_URL}/auth/reset-password-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      }),
    });

    if (!resetResponse.ok) {
      const errorData = await resetResponse.json();
      console.error(
        "❌ Password reset failed:",
        errorData.error || "Unknown error"
      );
      rl.close();
      return;
    }

    const resetData = await resetResponse.json();
    console.log("✅ Password reset successful!");
    console.log("\n" + "═".repeat(60));
    console.log("🎉 SUCCESS! Password has been reset.");
    console.log("═".repeat(60));
    console.log("\nYou can now login with:");
    console.log("  Email:", testEmail);
    console.log("  Password: [your new password]");
    console.log("\n📧 Check your email for confirmation.");
  } catch (error) {
    console.error("\n❌ Error:", error.message);

    if (error.message.includes("fetch failed")) {
      console.log("\n⚠️  Cannot connect to backend. Please:");
      console.log("1. Run: node wake-backend.js");
      console.log("2. Wait 60 seconds");
      console.log("3. Try again");
    }
  } finally {
    rl.close();
  }
}

// Run the test
testCompleteFlow();
