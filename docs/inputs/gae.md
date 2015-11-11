Google App Engine input plugin
---

Status : core plugin, unit tested and maintained.

This plugin is used to collect logs from a running Google App Engine Application.

You have to add a servlet in your App Engine App (see below). The plugin will poll the logs from this servlet.

This plugin collects logs 10s in the past to allow GAE internal logs propagation.

Example 1: to grab the logs from myapp GAE app, every minutes, on url ``http://myapp.appspot.com:80/logs?log_key=toto``
Config using url: ``input://gae://myapp.appspot.com:80?key=toto``

Config using logstash format:
````
input {
  gae {
    host => myapp.appspot.com
    port => 80
    key => toto
  }
}
````

Parameters:

* ``host``: hostname of the GAE webapp.
* ``port``: port of the GAE webapp.
* ``type``: to specify the log type, to faciliate crawling in kibana. Example: ``type=mygaeappp``. No default value.
* ``key``. the security key which will be sent in the http query to Google App Engine.
* ``ssl``: use ssl for grabbing logs. Use port 443 in this case. Default : false.
* ``polling``: polling delay. Default: 60s.
* ``servlet_name``: name of the servlet which serve logs. Default : ``logs``.
* ``access_logs_field_name`` and ``access_logs_type``. If the received line of log has a field ``access_logs_field_name``, the plugin will set the type of the line to ``access_logs_type``. It's used to differentiate access logs from application logs, to apply specific filter on access_logs. Standard config is : ``access_logs_type=nginx_access_logs&access_logs_field_name=http_method``. No default value.

Servlet
---

This servlet should render the logs in text format.
Each line must be a JSON that logstash can use.

Here is an exemple of a servlet rendering the access logs & application logs.
We use Gson for generating Json.

We use a very simple authentication system : a query string param ``log_key``.


````java
  //2014-09-09T13:18:00.000+0000
  protected SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");

  @Override
  void doGet(HttpServletRequest req, HttpServletResponse response) throws ServletException, IOException {
    if(!"my_key".equals(request.getParameter("log_key"))) {
      return response.sendError(401);
    }

    StringBuilder builder = new StringBuilder();

    //Get the timestamp from when getting the logs
    Long startTimestamp;
    try {
      startTimestamp = new Long(req.getParameter("start_timestamp"));
    } catch (NumberFormatException | NullPointerException e) {
      startTimestamp = new Date().getTime() - 1000 * 10; //10 sec
    }

    Long endTimestamp = new Date().getTime();

    LogQuery query = LogQuery.Builder.
        withDefaults().
        startTimeMillis(startTimestamp - 10 * 1000).
        endTimeMillis(endTimestamp - 10 * 1000).
        includeAppLogs(true);

    //Iterate over the access logs
    for (RequestLogs record : LogServiceFactory.getLogService().fetch(query)) {
      String requestId = record.getRequestId();
      if(!record.getResource().startsWith("/logs")) {
        builder.append(buildJsonForAccessLog(record)).
            append("\n");

        //Iterate over the app logs of this access log
        for (AppLogLine appLog : record.getAppLogLines()) {
          builder.
              append(buildJsonForApplicationLog(requestId, appLog)).
              append("\n");
        }
      }
    }

    response.getWriter().append(builder);
    response.addHeader("X-Log-End-Timestamp", endTimestamp.toString());
  }

  private String buildJsonForApplicationLog(String requestId, AppLogLine appLog) {
    JsonObject jsonObject = new JsonObject();
    jsonObject.addProperty("request_id", requestId);
    jsonObject.addProperty("message", appLog.getLogMessage().trim());
    jsonObject.addProperty("log_level", appLog.getLogLevel().name());
    jsonObject.addProperty("@timestamp", format.format(new Date(appLog.getTimeUsec() / 1000)));
    return gson.toJson(jsonObject);
  }

  //  ip,user,@timestamp,request,status,bytes_sent,referer,user_agent
  public String buildJsonForAccessLog(RequestLogs record) {
    JsonObject jsonObject = new JsonObject();
    jsonObject.addProperty("http_remote_ip", record.getIp());
    jsonObject.addProperty("http_path", record.getResource());
    jsonObject.addProperty("http_status", record.getStatus());
    jsonObject.addProperty("http_bytes_sent", record.getResponseSize());
    jsonObject.addProperty("http_referer", record.getReferrer());
    jsonObject.addProperty("http_user_agent", record.getUserAgent());
    jsonObject.addProperty("http_delay", record.getLatencyUsec() / 1000);
    jsonObject.addProperty("http_method", record.getMethod());
    jsonObject.addProperty("http_host", record.getHost());
    jsonObject.addProperty("cost", record.getCost());

    jsonObject.addProperty("@timestamp", format.format(new Date(record.getStartTimeUsec() / 1000)));
    jsonObject.addProperty("request_id", record.getRequestId());
    jsonObject.addProperty("message", record.getCombined());

    return gson.toJson(jsonObject);
  }
```

