import http from "node:http";

const shutdownUrl = "http://127.0.0.1:4177/__browser_test_shutdown__";

export default async function browserTestTeardown() {
  await new Promise((resolve, reject) => {
    const request = http.get(shutdownUrl, (response) => {
      response.resume();
      response.on("end", resolve);
    });
    request.setTimeout(3_000, () => {
      request.destroy(new Error("Timed out while stopping the browser test server."));
    });
    request.on("error", (error) => {
      if (error?.code === "ECONNREFUSED") {
        resolve();
        return;
      }
      reject(error);
    });
  });
}
