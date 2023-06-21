const duration = '1m';

export const testName = "standart";
export const entitiesTypes = ["site", "subscription"];
export const relations = ["viewer", "manager"];
export const actions = ["edit", "view"];

// const rel = {
//     user: [],
//     group: {
//         rel: [
//             'group#manager@user',
//             'group#member@user',
//         ],
//         actions: ["edit", "view"]
//     },
//     subscription: {
//         rel: [
//             'subscription#manager@user',
//             'subscription#manager@group#member',
//             'subscription#viewer@user',
//             'subscription#viewer@group#member',
//         ],
//         actions: ["edit", "view"]
//     },
//     site: {
//         rel: [
//             'site#viewer@user',
//             'site#viewer@group#member',
//             'site#manager@user',
//             'site#manager@group#member',
//             'site#backup_admin@user',
//             'site#backup_admin@group#member'
//         ],
//         actions: ["edit", "view"]
//     }
// }

export const entities = {
    user: {
        count: 500000,
        currentId: 1
    },
    site: {
        count: 3000,
        currentId: 1
    },
    subscription: {
        count: 150000,
        currentId: 1
    }
}

export const relationshipsGroups = [
    {
        users: 500000,
        entity: "subscription",
        entityPerUser: 1,
        relation: "manager"
    },
    {
        users: 150000,
        entity: "subscription",
        entityPerUser: 2,
        relation: "manager"
    },
    {
        users: 50000,
        entity: "subscription",
        entityPerUser: 1,
        relation: "viewer"
    },
    {
        users: 100000,
        entity: "site",
        entityPerUser: 1,
        relation: "manager"
    },
    {
        users: 50000,
        entity: "site",
        entityPerUser: 1,
        relation: "viewer"
    },
    {
        users: 50000,
        entity: "site",
        entityPerUser: 2,
        relation: "viewer"
    },
];

export const scenarios = {
    checkPermission: {
        // executor: 'constant-vus',
        // vus: 100,
        executor: "constant-arrival-rate",
        exec: "checkPermission",
        preAllocatedVUs: 50,
        duration,
        rate: 30000,
        timeUnit: '1m',
    },
    lookupEntity: {
        // executor: 'constant-vus',
        // vus: 100,
        executor: "constant-arrival-rate",
        exec: "lookupEntity",
        preAllocatedVUs: 50,
        duration,
        rate: 20000,
        timeUnit: '1m',
    },
    writeRelationshipRandom: {
        executor: "constant-arrival-rate",
        exec: "writeRelationshipRandom",
        preAllocatedVUs: 10,
        duration,
        rate: 1000,
        timeUnit: '1m',
    },
    deleteRelationship: {
        executor: "constant-arrival-rate",
        exec: "deleteRelationship",
        preAllocatedVUs: 10,
        duration,
        rate: 100,
        timeUnit: '1m',
    },
    // checkPermissionRandom: {
    //     executor: "constant-arrival-rate",
    //     exec: "checkPermissionRandom",
    //     preAllocatedVUs: 5,
    //     duration,
    //     rate: 10,
    //     timeUnit: '1m',
    // }
}
