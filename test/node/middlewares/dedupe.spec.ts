import { describe, it, before, beforeEach, after } from "node:test"
import * as http from "http"
import wretch, { WretchOption } from "../../../src"
import { dedupe } from "../../../src/middlewares"
import { mock } from "./mock"
import { expect } from "../helpers"

export default describe("Dedupe Middleware", () => {
  const PORT = 0
  let server: http.Server | null = null
  let logs: any[] = []

  const log = (url: string, options: WretchOption) => {
    logs.push([url, options.method])
  }

  const baseAddress = () => {
    const { address, port } = (server as any).address()
    return "http://" + address + ":" + port
  }

  before(async () => {
    await new Promise<void>((resolve, reject) => {
      server = http.createServer((req, res) => {
        req.pipe(res)
      })
      server.listen(PORT, "127.0.0.1")
      server.once("listening", () => {
        resolve()
      })
      server.once("error", () => {
        reject()
      })
    })
  })

  after(() => {
    server?.close()
  })

  beforeEach(() => {
    logs = []
  })

  it("should prevent sending multiple requests", async () => {
    const w = wretch(baseAddress()).fetchPolyfill(mock(log)).middlewares([dedupe()])
    const results = await Promise.all([
      w.get("/one").response(),
      w.get("/one").response(),
      w.get("/one").response(),
      w.get("/two").response(),
      w.get("/two").response(),
      w.get("/three").response(),
      w.post("body", "/one").response(),
      w.post("body", "/one").response(),
    ])

    expect(logs).toEqual([
      [baseAddress() + "/one", "GET"],
      [baseAddress() + "/two", "GET"],
      [baseAddress() + "/three", "GET"],
      [baseAddress() + "/one", "POST"],
      [baseAddress() + "/one", "POST"]
    ])

    results.forEach((result, i) => {
      expect(result).toMatchObject({
        url: baseAddress() + "/" + ((i < 3 || i > 5) ? "one" : i < 5 ? "two" : "three"),
        status: 200,
        statusText: "OK",
      })
    })
  })

  it("should skip some requests", async () => {
    const w = wretch(baseAddress()).fetchPolyfill(mock(log)).middlewares([dedupe({
      skip: (url, options) => { return options.skip || url.endsWith("/toto") }
    })])
    await Promise.all([
      w.get("/one").response(),
      w.get("/one").response(),
      w.get("/one").response(),
      w.options({ skip: true }).get("/one").response(),
      w.get("/toto").response(),
      w.get("/toto").response()
    ])

    expect(logs).toEqual([
      [baseAddress() + "/one", "GET"],
      [baseAddress() + "/one", "GET"],
      [baseAddress() + "/toto", "GET"],
      [baseAddress() + "/toto", "GET"],
    ])
  })

  it("should key requests", async () => {
    const w = wretch(baseAddress()).fetchPolyfill(mock(log)).middlewares([dedupe({
      key: () => { return "/same-key" }
    })])

    const results = await Promise.all([
      w.get("/one").response(),
      w.get("/two").response(),
      w.get("/three").response()
    ])

    expect(logs).toEqual([
      [baseAddress() + "/one", "GET"]
    ])

    results.forEach(result => {
      expect(result).toMatchObject({
        url: baseAddress() + "/one",
        status: 200,
        statusText: "OK",
      })
    })
  })

  it("should allow custom resolvers", async () => {
    const w = wretch(baseAddress()).fetchPolyfill(mock(log)).middlewares([dedupe({
      resolver: res => res
    })])

    const results = await Promise.all([
      w.get("/one").response(),
      w.get("/one").response(),
      w.get("/one").response()
    ])

    expect(results[0]).toStrictEqual(results[1])
    expect(results[0]).toStrictEqual(results[2])
  })
})