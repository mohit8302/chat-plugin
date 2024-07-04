const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://aat7sty0nd.execute-api.eu-north-1.amazonaws.com",
      changeOrigin: true,
      pathRewrite: {
        "^/api": "", // remove /api prefix when forwarding the request
      },
    })
  );
};
