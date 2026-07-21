const crypto=require('crypto');
const {promisify}=require('util');
const scrypt=promisify(crypto.scrypt);
(async()=>{const password=process.argv[2];if(!password||password.length<12)throw new Error('Pass a password of at least 12 characters');const salt=crypto.randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64);process.stdout.write(`$scrypt$${salt}$${hash.toString('hex')}\n`);})().catch(error=>{console.error(error.message);process.exit(1);});
