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