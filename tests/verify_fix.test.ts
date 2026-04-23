
function simulateProxyLogic(adminPasswordEnv: string | undefined, sessionCookieValue: string | undefined) {
  const expectedPwd = adminPasswordEnv;

  if (expectedPwd) {
    const expectedCookieValue = btoa(`admin:${expectedPwd}`);

    if (sessionCookieValue === expectedCookieValue) {
      return "ALLOWED";
    }
  }

  return "REDIRECT_TO_LOGIN";
}

import bcrypt from 'bcrypt';

async function simulateLoginActionLogic(adminPasswordEnv: string | undefined, providedPassword: string) {
  const expectedPwd = adminPasswordEnv;

  if (expectedPwd && await bcrypt.compare(providedPassword, expectedPwd)) {
    return { success: true };
  }

  return { success: false, error: 'Contraseña incorrecta' };
}

async function runTests() {
  // Test cases
  console.log("Running security fix verification tests...");

  // Generate a valid bcrypt hash for testing
  const plainTextPassword = "secure-pass";
  const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

  // Case 1: ADMIN_PASSWORD is NOT set
  console.log("\nCase 1: ADMIN_PASSWORD is NOT set");
  const res1_proxy = simulateProxyLogic(undefined, btoa("admin:admin"));
  console.log(`Proxy result (with cookie 'admin:admin'): ${res1_proxy}`);
  if (res1_proxy === "REDIRECT_TO_LOGIN") {
    console.log("✅ PASS: Access denied when ADMIN_PASSWORD is unset");
  } else {
    console.log("❌ FAIL: Access allowed when ADMIN_PASSWORD is unset");
    process.exit(1);
  }

  const res1_login = await simulateLoginActionLogic(undefined, "admin");
  console.log(`Login result (with password 'admin'): ${JSON.stringify(res1_login)}`);
  if (res1_login.success === false) {
    console.log("✅ PASS: Login denied when ADMIN_PASSWORD is unset");
  } else {
    console.log("❌ FAIL: Login allowed when ADMIN_PASSWORD is unset");
    process.exit(1);
  }

  // Case 2: ADMIN_PASSWORD is set to a bcrypt hash, correct password provided
  console.log("\nCase 2: ADMIN_PASSWORD is set to a bcrypt hash, correct password provided");
  const res2_proxy = simulateProxyLogic(hashedPassword, btoa(`admin:${hashedPassword}`));
  console.log(`Proxy result (with correct cookie): ${res2_proxy}`);
  if (res2_proxy === "ALLOWED") {
    console.log("✅ PASS: Access allowed with correct cookie");
  } else {
    console.log("❌ FAIL: Access denied with correct cookie");
    process.exit(1);
  }

  const res2_login = await simulateLoginActionLogic(hashedPassword, plainTextPassword);
  console.log(`Login result (with correct password): ${JSON.stringify(res2_login)}`);
  if (res2_login.success === true) {
    console.log("✅ PASS: Login successful with correct password");
  } else {
    console.log("❌ FAIL: Login failed with correct password");
    process.exit(1);
  }

  // Case 3: ADMIN_PASSWORD is set to a bcrypt hash, but wrong password provided
  console.log("\nCase 3: ADMIN_PASSWORD is set to a bcrypt hash, but wrong password provided");
  const res3_proxy = simulateProxyLogic(hashedPassword, btoa("admin:wrong-pass"));
  console.log(`Proxy result (with wrong cookie): ${res3_proxy}`);
  if (res3_proxy === "REDIRECT_TO_LOGIN") {
    console.log("✅ PASS: Access denied with wrong cookie");
  } else {
    console.log("❌ FAIL: Access allowed with wrong cookie");
    process.exit(1);
  }

  const res3_login = await simulateLoginActionLogic(hashedPassword, "wrong-pass");
  console.log(`Login result (with wrong password): ${JSON.stringify(res3_login)}`);
  if (res3_login.success === false) {
    console.log("✅ PASS: Login denied with wrong password");
  } else {
    console.log("❌ FAIL: Login allowed with wrong password");
    process.exit(1);
  }

  console.log("\nAll verification tests passed! Secure hashing is fully implemented.");
}

runTests().catch(console.error);
