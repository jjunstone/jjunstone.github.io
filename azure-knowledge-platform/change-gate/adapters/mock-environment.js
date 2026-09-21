/**
 * CHANGE GATE — Mock Adapters
 *
 * Each adapter stands in for the role an external system would play. There is
 * no network call, no credential, no real directory, tenant, host or schema
 * anywhere in this file. State lives in memory for the length of one case.
 *
 * Adapters only receive an operation the executor has already checked against
 * the approval token. They never widen scope and never invent an operation.
 */
window.ChangeGateAdapters = (function () {
  'use strict';

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /** In-memory synthetic access store shared by the adapters for one case. */
  function createMockEnvironment(options) {
    var initialState = options.initialState;
    var activeFaults = options.faults || {};

    var state = {
      adGroups: initialState.adGroups.slice(),
      resourceAccess: initialState.resourceAccess.slice(),
      expirations: Object.assign({}, initialState.expirations)
    };

    function readState() {
      return {
        adGroups: state.adGroups.slice(),
        resourceAccess: state.resourceAccess.slice(),
        expirations: Object.assign({}, state.expirations)
      };
    }

    /**
     * Read path used by verification. When a scenario declares a drift fault
     * the write is kept but the read omits it, which is what a real
     * post-change verification would surface as a mismatch.
     */
    function readVerificationState() {
      var observed = readState();
      Object.keys(activeFaults).forEach(function (system) {
        var dropped = activeFaults[system].dropOnRead || [];
        observed.adGroups = observed.adGroups.filter(function (g) { return dropped.indexOf(g) === -1; });
        observed.resourceAccess = observed.resourceAccess.filter(function (r) { return dropped.indexOf(r) === -1; });
      });
      return observed;
    }

    function makeAdapter(system) {
      return {
        system: system,
        apply: function (operation) {
          return delay(240).then(function () {
            if (operation.type === 'ADD_GROUP_MEMBER') {
              if (state.adGroups.indexOf(operation.scope) !== -1) {
                return { ok: true, result: 'ALREADY_PRESENT', detail: '이미 있어서 건너뜀' };
              }
              state.adGroups.push(operation.scope);
              return { ok: true, result: 'APPLIED', detail: null };
            }
            if (operation.type === 'REMOVE_GROUP_MEMBER') {
              state.adGroups = state.adGroups.filter(function (g) { return g !== operation.scope; });
              return { ok: true, result: 'APPLIED', detail: null };
            }
            if (operation.type === 'REMOVE_RESOURCE_ACCESS') {
              state.resourceAccess = state.resourceAccess.filter(function (r) { return r !== operation.scope; });
              delete state.expirations[operation.scope];
              return { ok: true, result: 'APPLIED', detail: null };
            }
            if (operation.type === 'ADD_RESOURCE_ACCESS') {
              if (state.resourceAccess.indexOf(operation.scope) !== -1) {
                return { ok: true, result: 'ALREADY_PRESENT', detail: '이미 있어서 건너뜀' };
              }
              state.resourceAccess.push(operation.scope);
              return { ok: true, result: 'APPLIED', detail: null };
            }
            if (operation.type === 'SET_EXPIRY') {
              // Only the access this change granted gets an expiry. Pre-existing
              // baseline membership is left alone.
              var appliesTo = (operation.meta && operation.meta.appliesTo) || [];
              appliesTo.forEach(function (key) { state.expirations[key] = operation.scope; });
              return { ok: true, result: 'APPLIED', detail: operation.scope + ' 자동 회수' };
            }
            return { ok: false, result: 'UNSUPPORTED_OPERATION', detail: operation.type };
          });
        },
        readState: function () {
          return delay(100).then(readState);
        }
      };
    }

    return {
      adapters: {
        ad: makeAdapter('ad'),
        vpn: makeAdapter('vpn'),
        firewall: makeAdapter('firewall'),
        database: makeAdapter('database'),
        hr: makeAdapter('hr')
      },
      readState: readState,
      readVerificationState: readVerificationState
    };
  }

  return { createMockEnvironment: createMockEnvironment };
})();
