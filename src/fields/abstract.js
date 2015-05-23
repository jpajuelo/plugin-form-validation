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


(function (ns, utils) {

    "use strict";

    var defineClass        = utils.inheritance.defineClass,
        updateObject       = utils.object.update,
        formatString       = utils.string.format,
        getSetting         = plugin.settings.get,
        ValidationError    = plugin.validators.ValidationError,
        RequiredValidator  = plugin.validators.RequiredValidator,
        EventCapturerMixin = plugin.mixins.EventCapturerMixin;

    // **********************************************************************************
    // CLASS DEFINITION
    // **********************************************************************************

    /**
     * [AbstractField description]
     *
     * @constructor
     * @param {String} name [description]
     * @param {Object.<String, *>} [options] [description]
     */
    ns.AbstractField = defineClass({

        constructor: function AbstractField(name, options) {
            options = updateObject(defaults, options);

            this.name = getName(name);

            this.label = getLabel(options);
            this.control = getControl.call(this, options);
            this.helpText = getHelpText(options);

            addAttrs.call(this, options.controlAttrs);

            this.element = createElement.call(this);
            this.validators = getValidators(options);

            this.state = ns.states.CLEANED;
            this.error = null;

            Object.defineProperty(this, 'errorMessage', {
                get: function get() {
                    return this.error !== null ? this.error.message : null;
                }
            });

            Object.defineProperty(this, 'value', {
                get: function get() {
                    return this.control.value.trim();
                }
            });

            this.mixinClass(0, ['failure', 'success']);
        },

        mixins: [EventCapturerMixin],

        members: {

            /**
             * [_insertError description]
             *
             * @param {ValidationError} error [description]
             * @returns {AbstractField} The instance on which the method is called.
             */
            _insertError: function _insertError(error) {
                this.element.insertBefore(error.get(), this.control.nextSibling);
                this.state = ns.states.FAILURE;
                this.error = error;

                return this.dispatch('failure', error.message, this);
            },

            /**
             * [_insertValue description]
             *
             * @param {String} value [description]
             * @returns {AbstractField} The instance on which the method is called.
             */
            _insertValue: function _insertValue(value) {
                this.state = ns.states.SUCCESS;
                this.control.value = value;

                return this.dispatch('success', value, this);
            },

            /**
             * [addAttr description]
             *
             * @param {String} name [description]
             * @param {String|Number|Boolean} value [description]
             * @returns {AbstractField} The instance on which the method is called.
             */
            addAttr: function addAttr(name, value) {
                this.control.setAttribute(name, value);

                return this;
            },

            /**
             * [addError description]
             *
             * @param {ValidationError} error [description]
             * @returns {AbstractField} The instance on which the method is called.
             */
            addError: function addError(error) {
                if (!(error instanceof ValidationError)) {
                    throw new TypeError("[error description");
                }

                return this.clean()._insertError(error);
            },

            /**
             * [addInitialValue description]
             *
             * @param {String|Number|Boolean} initialValue [description]
             * @returns {AbstractField} The instance on which the method is called.
             */
            addInitialValue: function addInitialValue(initialValue) {
                return this.clean()._insertValue(initialValue);
            },

            /**
             * [addValidator description]
             *
             * @param {AbstractValidator|Function} validator [description]
             */
            addValidator: function addValidator(validator) {
                this.validators.push(validator);

                return this;
            },

            /**
             * [clean description]
             *
             * @returns {AbstractField} The instance on which the method is called.
             */
            clean: function clean() {
                if (this.state === ns.states.FAILURE) {
                    removeError.call(this);
                }

                this.state = ns.states.CLEANED;

                return this;
            },

            /**
             * [validate description]
             *
             * @returns {AbstractField} The instance on which the method is called.
             */
            validate: function validate() {
                var value = this.clean().value;

                return findError.call(this, value) ? this : this._insertValue(value);
            }

        }

    });

    // **********************************************************************************
    // PRIVATE MEMBERS
    // **********************************************************************************

    var defaults = {
        required: true,
        label: "",
        helpText: "",
        controlTag: "",
        controlAttrs: {},
        validators: [],
        errorMessages: {}
    };

    var addAttrs = function addAttrs(controlAttrs) {
        for (var name in controlAttrs) {
            this.addAttr(name, controlAttrs[name]);
        }

        return this;
    };

    var createElement = function createElement() {
        var element = document.createElement(getSetting('fieldTag'));

        element.className = getSetting('fieldClass');

        if (this.label !== null) {
            element.appendChild(this.label);

            if (this.control.id) {
                this.label.setAttribute('for', this.control.id);
            }
        }

        element.appendChild(this.control);

        if (this.helpText !== null) {
            element.appendChild(this.helpText);
        }

        return element;
    };

    var findError = function findError(value) {
        return this.validators.some(function (validator) {
            return throwsError.call(this, validator, value);
        }, this);
    };

    var getControl = function getControl(options) {
        var control   = document.createElement(options.controlTag),
            controlId = getId(options.controlAttrs);

        if (controlId) {
            control.setAttribute('id', formatString(controlId, {
                name: this.name
            }));
        }

        control.className = getSetting('controlClass');
        control.name = this.name;

        return control;
    };

    var getHelpText = function getHelpText(options) {
        var helpText = null;

        if (options.helpText) {
            helpText = document.createElement(getSetting('helpTextTag'));
            helpText.className = getSetting('helpTextClass');
            helpText.textContent = options.helpText;
        }

        return helpText;
    };

    var getId = function getId(controlAttrs) {
        var id = 'id' in controlAttrs ? controlAttrs.id : getSetting('controlId');

        delete controlAttrs.id;

        return id;
    };

    var getLabel = function getLabel(options) {
        var label = null,
            optional;

        if (options.label) {
            label = document.createElement(getSetting('labelTag'));
            label.className = getSetting('labelClass');
            label.textContent = options.label;

            if (!options.required) {
                optional = label.appendChild(document.createElement('small'));
                optional.textContent('optional');
            }
        }

        return label;
    };

    var getName = function getName(name) {
        if (typeof name !== 'string' || !name.length) {
            throw new TypeError("The name must be a not-empty string.");
        }

        return name;
    };

    var getValidators = function getValidators(options) {
        if (options.required) {
            options.validators.unshift(new RequiredValidator());
        }

        return options.validators.map(function (validator) {
            if (validator.code in options.errorMessages) {
                validator.addMessage(options.errorMessages[validator.code]);
            }

            return validator;
        });
    };

    var removeError = function removeError() {
        this.element.removeChild(this.error.get());
        this.error = null;

        return this;
    };

    var throwsError = function throwsError(validator, value) {
        try {
            if (typeof validator === 'function') {
                validator(value, this);
            } else {
                validator.trigger(value, this);
            }
        } catch (e) {
            if (!(e instanceof ValidationError)) {
                throw e;
            }

            this._insertError(e);
        }

        return this.state === ns.states.FAILURE;
    };

})(plugin.fields, plugin.utils);
