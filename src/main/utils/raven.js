import { app } from "electron";
import os from "os";
import config from '../../config';
import settings from '../settings';
import { Logger } from './logger';

const { init } = require('@sentry/electron')

export const registerError = (err, ui) => {
    Logger.error(ui ? err.stack : err)
}

export const initialize = () => {

    const sendCrashReports = settings.get('app.crashReports')

    if (sendCrashReports && process.env.NODE_ENV === 'production') {
        init({
            dsn: config.SENTRY_URL,
            release: app.getVersion(),
            platform: os.platform(),
            platform_version: os.release(),
            arch: os.arch()
        })
    }

}