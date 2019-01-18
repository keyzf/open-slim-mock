const request = require('request');
require('colors');

/**
 * 对服务器进行反向代理，修改header实现跨域访问，便于在浏览器上调试
 * @author hgleifeng@foxmail.com
 * @since 2018.3.19
 */

const proxy = ({
                   dstHost,//代理的host
                   dumpPost = true,//是否打印post内容
                   dumpResponse = true,//是否打印response body
                   injectRespHeader = true//是否在响应头添加允许跨域字段
               }) => (match, {req, res, endWithText, dumpStream, injectHeader}) => {
    const {method, url} = req;
    console.log(match, url);
    return new Promise((resolve, reject) => {
        if (method === "GET" || method === "POST") {
            const remote = request(dstHost + url);
            remote.on("response", (remoteResp) => {
                if (injectRespHeader) {
                    injectHeader(remoteResp.headers, {});
                }
                const contentType = remoteResp.headers['content-type'];
                if (dumpResponse && contentType
                    && (contentType.indexOf("text") !== -1 || contentType.indexOf("json") !== -1)) {
                    dumpStream(remoteResp)
                } else {
                    console.log("data--> ".bgYellow + "[binary data]");
                }
            });
            let handleErr1 = handleErr(resolve, endWithText);
            req.on('error', handleErr1);
            remote.on('error', handleErr1);
            res.on('error', handleErr1);

            req.pipe(remote).pipe(res).on('finish', () => {
                resolve(true);
            });
        } else {
            //writeHead(res, 405)
            res.end('{"success": false,"errMsg": "not supported method"}');
            resolve(false);
        }
    })


};

const handleErr = (resolve, endWithText) => (err) => {
    console.log("on proxy error");
    console.error(err);
    endWithText(`${err}`, 400);
    resolve(false);
};

module.exports = proxy;







