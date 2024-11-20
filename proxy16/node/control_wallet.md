# Управление кошельком через RPC

## Список кошельков

```sh
curl --location 'http://localhost:36061/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic .............' \
--data '{
    "method": "listwallets",
    "params": []
}'
```

## Сценарий 1: Есть минимум один кошелек

В этом сценарии мы ничего не делаем и показываем главный экран.

## Сценарий 2: Генерация нового кошелька

Если кошелька нет и не предполагается импорт, то нужно создать новый кошелек.

- `wallet_name` : `STR (required)` The name for the new wallet. If this is a path, the wallet will be created at the path location.
- `disable_private_keys` : `BOOL (default: false)` Disable the possibility of private keys (only watchonlys are possible in this mode).
- `blank`, `BOOL (default: false)` Create a blank wallet. A blank wallet has no keys or HD seed. One can be set using sethdseed.
- `passphrase` : `STR` Encrypt the wallet with this passphrase.
- `avoid_reuse` : `BOOL (default: false)` Keep track of coin reuse, and treat dirty and clean coins differently with privacy considerations in mind.
- `descriptors` : `BOOL (default: false)` Create a native descriptor wallet. The wallet will use descriptors internally to handle address creation
- `load_on_startup` : `BOOL (default: false)` Save wallet name to persistent settings and load on startup. True to add wallet to startup list, false to remove, null to leave unchanged.

```sh
curl --location 'http://localhost:36061/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic .............' \
--data '{
    "method": "createwallet",
    "params": [
        "",
        false,
        false,
        "",
        false,
        false,
        true
    ]
}'
```

После создания через `listwallets` можно убедиться, что все прошло успешно. Теперь можно сделать бекап. Два способа:

1. Экспорт файла кошелька (список ключей + hdseed)
   
   Аргументы:
   - `filename` : Полный путь к сохраняемому файлу.

    ```sh
    curl --location 'http://localhost:36061/' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Basic .............' \
    --data '{
        "method": "dumpwallet",
        "params": [
            "/path/to/catalog/filename.dump"
        ]
    }'
    ```

2. Экспорт только `HDSEED`:
   
    ```sh
    curl --location 'http://localhost:36061/' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Basic .............' \
    --data '{
        "method": "gethdseed",
        "params": [
        ]
    }'
    ```


## Сценарий 3: Импорт из дамп файла

Для импорта кошелька из файла нужно создать новый кошелек и в него импортировать файл:

```sh
curl --location 'http://localhost:36061/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic .............' \
--data '{
    "method": "createwallet",
    "params": [
        "",
        false,
        false,
        "",
        false,
        false,
        true
    ]
}'
```

После создания через `listwallets` можно убедиться, что все прошло успешно. Теперь можно импортировать файл:

Аргументы:
- `filename` : Полный путь к файлу.

```sh
curl --location 'http://localhost:36061/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic .............' \
--data '{
    "method": "importwallet",
    "params": [
        "/path/to/catalog/filename.dump"
    ]
}'
```


## Сценарий 4: Импорт из HDSEED ключа

В этом сценарии нужно сделать `пустой` кошелек без ключей:

```sh
curl --location 'http://localhost:36061/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic .............' \
--data '{
    "method": "createwallet",
    "params": [
        "",
        false,
        true,   <<<< blank: true
        "",
        false,
        false,
        true
    ]
}'
```

После создания через `listwallets` можно убедиться, что все прошло успешно. Теперь можно импортировать hdseed:

Аргументы:
- `hdseed` : строка приватного ключа

```sh
curl --location 'http://localhost:36061/' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic .............' \
--data '{
    "method": "sethdseed",
    "params": [
        "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    ]
}'
```
