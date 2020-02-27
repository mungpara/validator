/*
 * @adonisjs/validator
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import isEmail from 'validator/lib/isEmail'
import normalizeEmail from 'validator/lib/normalizeEmail'
import { SyncValidation, EmailRuleOptions } from '@ioc:Adonis/Core/Validator'

import { ensureValidArgs } from '../../utils'
import { isObject } from '../../Validator/helpers'

const RULE_NAME = 'email'
const DEFAULT_MESSAGE = 'email validation failed'

/**
 * Shape of compiled options. It is a merged copy of
 * sanitization and validation options
 */
type CompiledOptions = Parameters<typeof isEmail>[1] & {
  sanitize?: {
    all_lowercase: boolean,
  },
}

/**
 * Validation signature for the "email" regex. Non-string values are
 * ignored.
 */
export const email: SyncValidation<CompiledOptions> = {
  compile (_, subtype, args) {
    if (subtype !== 'string') {
      throw new Error(`Cannot use email rule on "${subtype}" data type.`)
    }

    ensureValidArgs(RULE_NAME, args)
    const [options] = args as [EmailRuleOptions]

    /**
     * Compute sanitization options
     */
    let sanitizationOptions: CompiledOptions['sanitize']
    if (options && options.sanitize) {
      if (options.sanitize === true) {
        sanitizationOptions = { all_lowercase: true }
      } else if (isObject(options.sanitize)) {
        sanitizationOptions = { all_lowercase: options.sanitize.lowerCase }
      }
    }

    return {
      allowUndefineds: false,
      async: false,
      name: RULE_NAME,
      compiledOptions: options ? {
        domain_specific_validation: options.domainSpecificValidation || false,
        allow_ip_domain: options.allowIpDomain || false,
        ignore_max_length: options.ignoreMaxLength || false,
        sanitize: sanitizationOptions,
      } : {},
    }
  },
  validate (value, compiledOptions, { errorReporter, arrayExpressionPointer, pointer, mutate }) {
    /**
     * Ignore non-string values. The user must apply string rule
     * to validate string.
     */
    if (typeof (value) !== 'string') {
      return
    }

    /**
     * Invalid email
     */
    if (!isEmail(value, compiledOptions)) {
      errorReporter.report(pointer, RULE_NAME, DEFAULT_MESSAGE, arrayExpressionPointer)
      return
    }

    /**
     * Apply lower case sanitization
     */
    if (compiledOptions.sanitize?.all_lowercase) {
      mutate(normalizeEmail(value, compiledOptions.sanitize))
    }
  },
}
