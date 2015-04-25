/**
 *  Copyright 2015 Jaime Pajuelo
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */


"use strict";


fmval.validators.ValidationError = (function () {

    /**
     * @constructor
     * @param {String} message
     */
    var ValidationError = function ValidationError(message) {
        if (this.parentClass.hasOwnProperty('captureStackTrace')) {
            this.parentClass.captureStackTrace(this, this.constructor);
        }

        this.message = message;

        this.element = document.createElement('p');
        this.element.className = "control-error";
        this.element.textContent = message;
    };

    ValidationError.inherit(Error);

    /**
     * @type {String}
     */
    ValidationError.member('name', "ValidationError");

    return ValidationError;

})();
