#!/usr/bin/env node
//@ts-check

const os = require('os');
const download = require('download');
const cp = require('child_process');
const isInstalledGlobally = require('is-installed-globally');
const { copyFileSync, chmodSync, unlinkSync, readFileSync } = require('fs');
const { join } = require('path');

const getArch = () =>
    ({
        arm: 'arm',
        arm64: 'arm64',
        ia32: '386',
        mips: 'mips',
        mipsel: 'mipsle',
        ppc: 'ppc',
        ppc64: 'ppc64',
        s390: 's390',
        s390x: 's390x',
        x64: 'amd64',
    }[os.arch()]);

const getPlatform = () =>
    ({
        darwin: 'darwin',
        freebsd: 'freebsd',
        linux: 'linux',
        openbsd: 'openbsd',
        sunos: 'solaris',
        win32: 'windows',
        aix: 'aix',
    }[os.platform()]);

const getPackageJson = () => {
    const packageJson = readFileSync(
        join(process.cwd(), 'package.json'),
        'utf8'
    );
    return JSON.parse(packageJson);
};

const getBinPath = () => {
    if (isInstalledGlobally) {
        return cp.execSync('npm bin -g').toString().trim();
    } else {
        const npmRoot = cp.execSync('npm root').toString().trim();
        //trim npmRoot until the first node_modules folder
        const nodeModulesIndex = npmRoot.indexOf('node_modules');
        if (nodeModulesIndex === -1) {
            throw new Error('Unable to determine npm root');
        }
        return join(
            npmRoot.substring(0, nodeModulesIndex),
            'node_modules',
            '.bin'
        );
    }
};

const getMetadata = () => {
    const pkg = getPackageJson();
    const binName = pkg.goforblob.name;
    const version = pkg.version;
    const arch = getArch();
    const platform = getPlatform();
    const url = pkg.goforblob.url
        .replace(/\{version\}/g, version)
        .replace(/\{platform\}/g, platform)
        .replace(/\{arch\}/g, arch)
        .replace(/\{name\}/g, binName);

    return {
        version,
        arch,
        platform,
        url,
        binFileName: `${binName}${platform === 'windows' ? '.exe' : ''}`,
        binPath: getBinPath(),
        downloadPath: join(process.cwd(), '.tmp'),
    };
};

const install = async () => {
    const { platform, url, binFileName, binPath, downloadPath } = getMetadata();
    console.log(`Downloading ${url}`);
    await download(url, downloadPath, { extract: true });
    console.log(`Copying to ${binPath}`);
    copyFileSync(join(downloadPath, binFileName), join(binPath, binFileName));
    if (platform !== 'windows') {
        chmodSync(join(binPath, binFileName), 0o755);
    }
    console.log(`${binFileName} is installed`);
};

const uninstall = () => {
    const { binFileName, binPath } = getMetadata();
    const binFilePath = join(binPath, binFileName);
    console.log(`Removing ${binFilePath}`);
    try {
        unlinkSync(binFilePath);
    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log(`${binFilePath} does not exist`);
        } else {
            throw e;
        }
    }

    console.log(`${binFileName} is removed`);
};

const main = async () => {
    const command = process.argv[2];
    if (command === 'install') {
        await install();
    } else if (command === 'uninstall') {
        uninstall();
    } else {
        console.log(`Usage: goforblob [install|uninstall]`);
    }
};

main().catch((e) => {
    console.error(e.stack);
    process.exit(1);
});
