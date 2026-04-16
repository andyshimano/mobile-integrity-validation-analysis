# Weak Integrity Validation in Mobile Application (Action Binding Simulation)

## Overview

This project presents a security analysis of a mobile application implementing request integrity validation logic.  
The goal was to evaluate whether the application properly protects request parameters from tampering.

The analysis was conducted in a controlled lab environment simulating client-server interaction.

---

## Objective

Assess the robustness of integrity validation and identify weaknesses that may allow attackers to bypass request validation.

---

## Methodology

The following techniques were used:

- Static analysis (jadx, grep)
- Dynamic analysis (Frida instrumentation)
- Runtime behavior observation
- Input manipulation / fuzzing

Additional notes:

- Stack trace is captured only once to avoid performance overhead.
- Digest inputs were inspected both in raw (hex) and decoded (string) form to identify meaningful request structure.

---

## Key Findings

The application uses a weak integrity validation mechanism:

- SHA-256 hash is calculated from request parameters
- Validation is performed using prefix comparison:
  
     `hash.startsWith("00")`

- Validation relies on probabilistic condition instead of deterministic equality

---  

### Issues

- Partial hash comparison (only prefix is validated)
- Probabilistic validation (non-deterministic behavior)
- Weak binding between request parameters and validation logic

---

## Impact

An attacker can bypass integrity validation by brute-forcing input values that produce a valid hash prefix.
This allows an attacker to bypass integrity validation and manipulate request parameters without modifying the application binary
or bypassing runtime protections.

As a result:

- Request tampering without modifying application code
- Unauthorized manipulation of request parameters

---

## Exploitation

The integrity validation can be bypassed by brute-forcing input values.

Since the validation only checks whether the SHA-256 hash starts with "00",
the probability of a valid input is approximately 1/256.

An attacker can exploit this by iterating over request parameters
until a valid combination is found.

This does not require modifying the application or bypassing protections.

---

## Proof of Concept (PoC)

### Approach

A brute-force attack was implemented to identify valid request parameters.

The "amount" parameter was iteratively modified until the validation condition was satisfied.

---

### Python PoC

```python
import requests

URL = "http://target/api/validate"

def send_request(user, amount):
    return requests.post(URL, json={
        "user": user,
        "amount": amount
    })

def fuzz():

    for i in range(1, 1000):
        r = send_request("user1", i) 

        if "OK" in r.text:
            print(f"[+] Valid request found: amount={i}")
            return i

    print("[-] No valid input found")

if __name__ == "__main__":
    fuzz()
```

---

### Expected Result

A valid request is found within a small number of attempts (~256 on average),
demonstrating that the integrity mechanism can be bypassed efficiently.

---

## Root Cause

Improper integrity validation design:

- Hash is not fully verified
- No strict equality check
- No secure binding between all request parameters

---

## Security Assessment

Severity: Medium

Justification:

- Exploitation requires no advanced techniques
- Attack can be automated easily
- Integrity guarantees are fundamentally broken

This represents a design flaw rather than an implementation bug.

---

## Recommendations

- Use full hash comparison (constant-time equality)
- Ensure all parameters are included in validation
- Move validation logic to backend
- Use cryptographic signatures or nonce-based binding (e.g., Play Integrity API)

---

## Conclusion

The implemented integrity mechanism does not provide sufficient protection against request tampering.

This case demonstrates how partial cryptographic validation leads to exploitable weaknesses even when strong
primitives (SHA-256) are used incorrectly. 

Importantly, this vulnerability is architectural in nature and cannot be mitigated solely by strengthening
client-side protections.

---

## Tools

- Frida
- JADX
- Python (for fuzzing)
- ADB

---

## Disclaimer

This analysis was performed in a controlled lab environment for educational and research purposes only.
