var r = require('rethinkdb'),
 inspect = require('util').inspect,
 log = require('../log'),
 ip = {
    ip: 'number',
    ports: [],
    geo: ''
}
const db = 'scanner'

var handleError = (e)=>{
    log.error(e)
}

r.connect({host:'localhost', port: 32769}).then((conn)=>{
    checkExists(conn).then((data)=>{
        log.info(data)
        if(data){
            log.info('DB Does not exists.  Creating')
            r.dbCreate(db).run(conn).then((data)=>{
                log.info('DB Created: ', data)
                log.info('Creating Tables')
                createTables(conn, ['ips','logs']).then((results)=>{
                    console.log(results)
                }).catch(handleError)
            }).catch(handleError)
        }else if(!data){
            createTables(conn, ['ips','logs']).then((results)=>{
                console.log(results)
            }).catch(handleError)
        }
    }).catch(handleError)
}).catch(handleError)

const createTables = (conn, names)=>{
    var tables = []
    log.info('Attempting to create ' + names)
    if(names.length === 1){
        log.info('Attempting to create table ' + names[0])
        return createTable(names)
    }
    
    for(let i = 0; i< names.length; i++){
        log.info('pushing table ' + names[i])
        tables.push(createTable(conn, names[i]))
    }
    return Promise.all(tables)
}

const createTable = (conn, name)=>{
    return r.db(db).tableList().run(conn).then((list)=>{
        log.info(list)
        if(list.indexOf(name) === -1 ){
            log.info('Created table ' + name)
            return r.db(db).tableCreate(name).run(conn)
        }else if(list.indexOf(name) > -1){
            log.info('table '+ name + ' exists')
            return Promise.reject('table ' + name + ' exists')
        }
    })
}

const checkExists = (conn)=>{
    return r.dbList().run(conn).then((data)=>{
        log.info(data)
        return checkDB(conn, data)
    })
}
         

const deleteDB = (conn,cb)=>{
    return r.dbList().run(conn).then((data)=>{  
        if(data.indexOf(db) !== -1){
            return r.dbDrop(db).run(conn)
        }
    }).catch(handleError)
}

const checkDB = (conn, data)=>{
    return new Promise((resolve, reject)=>{
        {    
            var exists = data.indexOf(db)
            if(exists > -1){
                log.info('scanner exists in index %s',data.indexOf(db))
                resolve(false)
            }else if(exists === -1){
                log.warning('DB Does not exist')
                resolve(true)
            } 
            Promise.reject('failure somewhere')
        }    
    })
}