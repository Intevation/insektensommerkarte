[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/BjoernSchilberg/insektensommerkarte)

# insektensommerkarte

- [insektensommerkarte](#insektensommerkarte)
  - [FTP connection](#ftp-connection)
  - [Size Limit: Make the Web lighter](#size-limit-make-the-web-lighter)
  - [upgrade all the packages in your package.json](#upgrade-all-the-packages-in-your-packagejson)

## FTP connection

```shell
ncftp -u $FTP_USER -p $FTP_PASSWORD $FTP_SERVER
```

## Size Limit: Make the Web lighter
- https://evilmartians.com/chronicles/size-limit-make-the-web-lighter

```shell
yarn run size
```

```shell
npx size-limit --why
```

## upgrade all the packages in your package.json 

```shell
yarn upgrade --latest
```
