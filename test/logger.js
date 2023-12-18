import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import properties from "./properties";

const { combine, timestamp, printf, splat, simple } = format;

const filename = `${properties.log.filename}-%DATE%.log`;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const myTransport = new DailyRotateFile({
  dirname: "logs",
  filename,
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "7d",
});

const logger = createLogger({
  level: properties.log.level,
  format: combine(
    splat(),
    simple(),
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    myFormat,
  ),
  transports: [myTransport, new transports.Console()],
});

export default logger;
