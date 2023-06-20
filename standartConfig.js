const duration = '1m';

export const testName = "standart";
export const entitiesTypes = ["site", "subscription"];
export const relations = ["viewer", "manager"];
export const actions = ["edit", "view"];

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
        users: 15000,
        entity: "subscription",
        entityPerUser: 2,
        relation: "manager"
    },
    {
        users: 5000,
        entity: "subscription",
        entityPerUser: 1,
        relation: "viewer"
    },
    {
        users: 30000,
        entity: "site",
        entityPerUser: 1,
        relation: "manager"
    },
    {
        users: 5000,
        entity: "site",
        entityPerUser: 1,
        relation: "viewer"
    },
];

export const scenarios = {
    checkPermission: {
        executor: "constant-arrival-rate",
        exec: "checkPermission",
        preAllocatedVUs: 10,
        duration,
        rate: 100,
        timeUnit: '2s',
    },
    lookupEntity: {
        executor: "constant-arrival-rate",
        exec: "lookupEntity",
        preAllocatedVUs: 10,
        duration,
        rate: 500,
        timeUnit: '1m',
    },
    writeRelationshipRandom: {
        executor: "constant-arrival-rate",
        exec: "writeRelationshipRandom",
        preAllocatedVUs: 5,
        duration,
        rate: 50,
        timeUnit: '1m',
    },
    deleteRelationship: {
        executor: "constant-arrival-rate",
        exec: "deleteRelationship",
        preAllocatedVUs: 5,
        duration,
        rate: 50,
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
