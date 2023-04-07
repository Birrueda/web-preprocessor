/**
 * @license
 * Copyright 2015 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

// Pthread Web Worker startup routine:
// This is the entry point file that is loaded first by each Web Worker
// that executes pthreads on the Emscripten application.

'use strict';

var Module = {};

// Thread-local guard variable for one-time init of the JS state
var initializedJS = false;

// Proxying queues that were notified before the thread started and need to be
// executed as part of startup.
var pendingNotifiedProxyingQueues = [];

function threadPrintErr() {
  var text = Array.prototype.slice.call(arguments).join(' ');
  console.error(text);
}
function threadAlert() {
  var text = Array.prototype.slice.call(arguments).join(' ');
  postMessage({cmd: 'alert', text: text, threadId: Module['_pthread_self']()});
}
var err = threadPrintErr;
self.alert = threadAlert;

Module['instantiateWasm'] = (info, receiveInstance) => {
  // Instantiate from the module posted from the main thread.
  // We can just use sync instantiation in the worker.
  var instance = new WebAssembly.Instance(Module['wasmModule'], info);
  // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193,
  // the above line no longer optimizes out down to the following line.
  // When the regression is fixed, we can remove this if/else.
  receiveInstance(instance);
  // We don't need the module anymore; new threads will be spawned from the main thread.
  Module['wasmModule'] = null;
  return instance.exports;
}

self.onmessage = (e) => {
  try {
    if (e.data.cmd === 'load') { // Preload command that is called once per worker to parse and load the Emscripten code.

      // Module and memory were sent from main thread
      Module['wasmModule'] = e.data.wasmModule;

      Module['wasmMemory'] = e.data.wasmMemory;

      Module['buffer'] = Module['wasmMemory'].buffer;

      Module['ENVIRONMENT_IS_PTHREAD'] = true;

      if (typeof e.data.urlOrBlob == 'string') {
        importScripts(e.data.urlOrBlob);
      } else {
        var objectUrl = URL.createObjectURL(e.data.urlOrBlob);
        importScripts(objectUrl);
        URL.revokeObjectURL(objectUrl);
      }
    } else if (e.data.cmd === 'run') {
      // This worker was idle, and now should start executing its pthread entry
      // point.
      // performance.now() is specced to return a wallclock time in msecs since
      // that Web Worker/main thread launched. However for pthreads this can
      // cause subtle problems in emscripten_get_now() as this essentially
      // would measure time from pthread_create(), meaning that the clocks
      // between each threads would be wildly out of sync. Therefore sync all
      // pthreads to the clock on the main browser thread, so that different
      // threads see a somewhat coherent clock across each of them
      // (+/- 0.1msecs in testing).
      Module['__performance_now_clock_drift'] = performance.now() - e.data.time;

      // Pass the thread address inside the asm.js scope to store it for fast access that avoids the need for a FFI out.
      Module['__emscripten_thread_init'](e.data.threadInfoStruct, /*isMainBrowserThread=*/0, /*isMainRuntimeThread=*/0, /*canBlock=*/1);

      // Also call inside JS module to set up the stack frame for this pthread in JS module scope
      Module['establishStackSpace']();
      Module['PThread'].receiveObjectTransfer(e.data);
      Module['PThread'].threadInitTLS();

      if (!initializedJS) {
        // Embind must initialize itself on all threads, as it generates support JS.
        // We only do this once per worker since they get reused
        Module['___embind_register_native_and_builtin_types']();

        // Execute any proxied work that came in before the thread was
        // initialized. Only do this once because it is only possible for
        // proxying notifications to arrive before thread initialization on
        // fresh workers.
        pendingNotifiedProxyingQueues.forEach(queue => {
          Module['executeNotifiedProxyingQueue'](queue);
        });
        pendingNotifiedProxyingQueues = [];
        initializedJS = true;
      }

      try {
        Module['invokeEntryPoint'](e.data.start_routine, e.data.arg);
      } catch(ex) {
        if (ex != 'unwind') {
          // ExitStatus not present in MINIMAL_RUNTIME
          if (ex instanceof Module['ExitStatus']) {
            if (Module['keepRuntimeAlive']()) {
            } else {
              Module['__emscripten_thread_exit'](ex.status);
            }
          }
          else
          {
            // The pthread "crashed".  Do not call `_emscripten_thread_exit` (which
            // would make this thread joinable.  Instead, re-throw the exception
            // and let the top level handler propagate it back to the main thread.
            throw ex;
          }
        }
      }
    } else if (e.data.cmd === 'cancel') { // Main thread is asking for a pthread_cancel() on this thread.
      if (Module['_pthread_self']()) {
        Module['__emscripten_thread_exit'](-1/*PTHREAD_CANCELED*/);
      }
    } else if (e.data.target === 'setimmediate') {
      // no-op
    } else if (e.data.cmd === 'processProxyingQueue') {
      if (initializedJS) {
        Module['executeNotifiedProxyingQueue'](e.data.queue);
      } else {
        // Defer executing this queue until the runtime is initialized.
        pendingNotifiedProxyingQueues.push(e.data.queue);
      }
    } else {
      err('worker.js received unknown command ' + e.data.cmd);
      err(e.data);
    }
  } catch(ex) {
    err('worker.js onmessage() captured an uncaught exception: ' + ex);
    if (ex && ex.stack) err(ex.stack);
    if (Module['__emscripten_thread_crashed']) {
      Module['__emscripten_thread_crashed']();
    }
    throw ex;
  }
};

