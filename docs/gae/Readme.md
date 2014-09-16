GAE Input
=========

You have to deploy a servlet in your GAE app to get the logs.
This servler should render the logs in text format.
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

