import flask

app = flask.Flask (__name__)
@app.route ("/")
def root ():
    # response = flask.Response ("<head><script>window.onload=(e)=>{import('/client');};</script></head>")
    response = flask.Response ("<head><script src='/client'></script></head>")
    response.headers ["Access-Control-Allow-Origin"] = "*"
    return response
@app.route ("/client")
def client (): return flask.send_file ("client.js", cache_timeout = -1)

app.run (host = "localhost", port = 6900)