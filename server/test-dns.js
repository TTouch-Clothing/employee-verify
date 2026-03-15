// test-dns.js
import dns from "dns/promises";

try {
  const records = await dns.resolveSrv("_mongodb._tcp.cluster0.wfewxcm.mongodb.net");
  console.log("SRV records:", records);
} catch (err) {
  console.error("DNS test failed:");
  console.error(err);
}