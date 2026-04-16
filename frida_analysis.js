//=========================
// Helpers
//=========================

function byteArrayToHexString(p) {
  try {

    const u8 = new Uint8Array(p);
    let hex = '';
    for (let i = 0; i < u8.length; i++) {
      const b = u8[i];
      hex += (b < 16 ? '0' : '') + b.toString(16);
    }
    return  hex;
  } catch (e) {
    log(e);
    return null;
  }
}

function safeToString(bytes) {

    try {
        var str = "";

        for (var i = 0; i < bytes.length; i++) {
            var b = bytes[i] & 0xFF;

            // printable ASCII range
            if (b >= 32 && b <= 126) {
                str += String.fromCharCode(b);
            } else {
                return null; 
            }
        }

        return str;

    } catch (e) {
        return null;
    }
}

function getTrace() {
    var Exception = Java.use("java.lang.Exception");

    // print stack
    var stack = Exception.$new().getStackTrace();
    for (var i = 0; i < stack.length; i++) {
        console.log(stack[i].toString());
    }
}

var digest = null;

function hookMessageDigest() {

    var MessageDigest = Java.use('java.security.MessageDigest');
    var tracePrinted = false;
    
    MessageDigest.digest.overloads.forEach(function (overload) {

        overload.implementation = function () {
         
            console.log("\n[+] detect digest");
            if (arguments.length) {
                var hex = byteArrayToHexString(arguments[0]);
                var str = safeToString(arguments[0]);

                if (str !== null) {
                    console.log("digest input (string): " + str);
                } else {
                    console.log("digest input (hex): " + hex);
                }
            }         

            var result = overload.apply(this, arguments);
            digest = byteArrayToHexString(result);
                 
            var algo = this.getAlgorithm();

            console.log("Digest used: " + algo);
            console.log("Digest return: " + byteArrayToHexString(result));
            
            if (!tracePrinted && arguments.length > 0) {
                console.log("\n[DIGEST TRACE]");
                getTrace();
                tracePrinted = true;
            }
            
            return result;
        };
    });

    console.log("MessageDigest.digest hook loaded");
}

function hookStartsWith() {

    var StringCls = Java.use('java.lang.String'); 

    StringCls.startsWith.overload('java.lang.String').implementation = function (prefix) {
                
        var result = this.startsWith(prefix);            

        // attempt to detect "right" call and minimize noise        
        if (digest !== null && this.toString() === digest) {
            console.log("\n[+] detect startsWith: " + this.toString() + " " + prefix + " -> " + result);
            
            console.log("\n[STARTSWITH TRACE]");          
            getTrace();
        }

        return result;        
    }

    console.log("String.startsWith hook loaded");
}

function hookValidate() {

    var hookValid = Java.use('com.example.integritylabv2.logic.RequestValidator');

    hookValid.validate.implementation = function () {
                
        var original = this.validate;
        var result = original.apply(this, arguments);
        
        console.log("\n[+] detect validate() with " + arguments.length + " arguments: ");
        for (var i = 0; i < arguments.length; i++) {
            console.log(arguments[i]);
        }

        console.log("validate() return " + result);

        return result;
        
    };

    console.log("validate() hook loaded");
}

function init() {

   Java.perform(function () {
      
      hookMessageDigest();
      hookStartsWith();
      hookValidate();    

      console.log("Java hooks loaded");           

   });
}

setImmediate(init);
