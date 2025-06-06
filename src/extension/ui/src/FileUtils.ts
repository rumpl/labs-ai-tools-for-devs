/**
 * FileWatcher.ts
 * This file is not used due to inability to clean up inotifywait processes
 */
import { v1 } from "@docker/extension-api-client-types"
import { ExecResult } from "@docker/extension-api-client-types/dist/v0"
import { BUSYBOX } from "./Constants"

export const tryRunImageSync = async (client: v1.DockerDesktopClient, args: string[], ignoreError = false) => {
    const showError = ignoreError ? () => { } : client.desktopUI.toast.error
    try {
        const result = await client.docker.cli.exec('run', args)
        if (result.stderr) {
            showError(result.stderr)
        }
        return result.stdout || ''
    }
    catch (e) {
        if (e instanceof Error) {
            showError(e.message)
        }
        if ((e as ExecResult).stderr) {
            showError(JSON.stringify(e))
        }
        return ''
    }
}

export const getUser = async (client: v1.DockerDesktopClient) => {
    const result = await tryRunImageSync(client, ['--rm', '-e', 'USER', BUSYBOX, '/bin/echo', '$USER'])
    return result.trim()
}

export const readFileInPromptsVolume = async (client: v1.DockerDesktopClient, path: string) => {
    return tryRunImageSync(client, ['--rm', '-v', 'docker-prompts:/docker-prompts', '-w', '/docker-prompts', BUSYBOX, '/bin/cat', `${path}`], true)
}

export const writeToPromptsVolume = async (client: v1.DockerDesktopClient, filename: string, content: string) => {
    return tryRunImageSync(client, [
        "--rm",
        "-v",
        "docker-prompts:/workdir",
        "-w",
        "/workdir",
        BUSYBOX,
        "/bin/sh",
        "-c",
        `'echo "${encodeBase64(content)}" | base64 -d > ${filename}'`,
    ]);
}

export const writeToMount = async (client: v1.DockerDesktopClient, mount: string, filename: string, content: string) => {
    return tryRunImageSync(client, [
        "--rm",
        '--mount',
        mount,
        BUSYBOX,
        "/bin/sh",
        "-c",
        `'echo "${encodeBase64(content)}" | base64 -d > ${filename}'`,
    ]);
}

const encodeBase64 = (input: string): string => {
    const utf8Bytes = new TextEncoder().encode(input);
    const binary = Array.from(utf8Bytes).map(byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
};