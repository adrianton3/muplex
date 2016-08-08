exports.AstBuilder = (function () {
	"use strict"

	const { Add } = require('../interpreter/nodes/Add.js')
	const { And } = require('../interpreter/nodes/And.js')
	const { ArrJS } = require('../interpreter/nodes/ArrJS.js')
	const { Bool } = require('../interpreter/nodes/Bool.js')
	const { BoolQ } = require('../interpreter/nodes/BoolQ.js')
	const { Call } = require('../interpreter/nodes/Call.js')
	const { CallJS } = require('../interpreter/nodes/CallJS.js')
	const { ClosureQ } = require('../interpreter/nodes/ClosureQ.js')
	const { ContainsQ } = require('../interpreter/nodes/ContainsQ.js')
	const { Def } = require('../interpreter/nodes/Def.js')
	const { Deref } = require('../interpreter/nodes/Deref.js')
	const { Div } = require('../interpreter/nodes/Div.js')
	const { Fun } = require('../interpreter/nodes/Fun.js')
	const { Fst } = require('../interpreter/nodes/Fst.js')
	const { Greater } = require('../interpreter/nodes/Greater.js')
	const { If } = require('../interpreter/nodes/If.js')
	const { Let } = require('../interpreter/nodes/Let.js')
	const { Mod } = require('../interpreter/nodes/Mod.js')
	const { Module } = require('../interpreter/Module.js')
	const { ModuleSet } = require('../interpreter/ModuleSet.js')
	const { Mul } = require('../interpreter/nodes/Mul.js')
	const { Not } = require('../interpreter/nodes/Not.js')
	const { Num } = require('../interpreter/nodes/Num.js')
	const { NumQ } = require('../interpreter/nodes/NumQ.js')
	const { Or } = require('../interpreter/nodes/Or.js')
	const { Pair } = require('../interpreter/nodes/Pair.js')
	const { PairQ } = require('../interpreter/nodes/PairQ.js')
	const { Record } = require('../interpreter/nodes/Record.js')
	const { RecordQ } = require('../interpreter/nodes/RecordQ.js')
	const { Set } = require('../interpreter/nodes/Set.js')
	const { SetFst } = require('../interpreter/nodes/SetFst.js')
	const { SetSnd } = require('../interpreter/nodes/SetSnd.js')
	const { Snd } = require('../interpreter/nodes/Snd.js')
	const { Str } = require('../interpreter/nodes/Str.js')
	const { StrQ } = require('../interpreter/nodes/StrQ.js')
	const { Sub } = require('../interpreter/nodes/Sub.js')
	const { Unit } = require('../interpreter/nodes/Unit.js')
	const { UnitQ } = require('../interpreter/nodes/UnitQ.js')
	const { Var } = require('../interpreter/nodes/Var.js')
	const { Xor } = require('../interpreter/nodes/Xor.js')

	const mapping = new Map()

	const register = Map.prototype.set.bind(mapping)

	function registerUnary (name, constructor) {
		register(name, (e) => new constructor(
			buildAst(e)
		))
	}

	function registerBinary (name, constructor) {
		register(name, (e1, e2) => new constructor(
			buildAst(e1),
			buildAst(e2)
		))
	}

	registerUnary('not', Not)

	registerUnary('bool?', BoolQ)
	registerUnary('closure?', ClosureQ)
	registerUnary('num?', NumQ)
	registerUnary('pair?', PairQ)
	registerUnary('record?', RecordQ)
	registerUnary('str?', StrQ)
	registerUnary('unit?', UnitQ)

	registerUnary('fst', Fst)
	registerUnary('snd', Snd)

	registerBinary('+', Add)
	registerBinary('-', Sub)
	registerBinary('*', Mul)
	registerBinary('/', Div)
	registerBinary('%', Mod)

	registerBinary('>', Greater)

	registerBinary('and', Add)
	registerBinary('or', Or)
	registerBinary('xor', Xor)

	registerBinary('pair', Pair)

	registerBinary('set-fst!', SetFst)
	registerBinary('set-snd!', SetSnd)

	register('if', (test, consequent, alternate) =>
		new If(
			buildAst(test),
			buildAst(consequent),
			buildAst(alternate)
		)
	)

	register('call', (callee, ...args) => {
		if (args.length === 0) {
			return new Call(buildAst(callee), false)
		} else {
			return args.reduce(
				(prev, arg) => new Call(prev, buildAst(arg)),
				buildAst(callee)
			)
		}
	})

	register('fun', (name, args, body) => {
		// verify that args are indeed args

		if (args.children.length === 0) {
			return new Fun(name, false, buildAst(body))
		} else {
			const partial = args.children.slice(1).reduceRight(
				(prev, arg) => new Fun(false, arg, prev),
				buildAst(body)
			)

			return new Fun(name, args.children[0], partial)
		}
	})

	register('list', (...items) => {
		if (items.length === 0) {
			return new Pair(new Unit(), new Unit())
		} else {
			return items.reduceRight(
				(prev, item) => new Pair(buildAst(item), prev),
				new Unit()
			)
		}
	})

	register('cond', (...items) => {
		return items.slice(-1).reduceRight(
			(prev, { test, consequent }) =>
				new If(
					buildAst(test),
					buildAst(consequent),
					prev
				),
			buildAst(items[items.length - 1])
		)
	})

	register('let', (items, body) => {
		return items.children.reduceRight(
			(prev, { token, children }) => {
				if (
					token.type !== '(' ||
					children.length !== 2
				) {
					throw 'binding must be a pair'
				}

				const [name, expression] = children

				if (name.token.type !== 'identifier') {
					throw 'must be an identifier'
				}

				return new Let(name, buildAst(expression), prev)
			},
			buildAst(body)
		)
	})

	function buildAst (tree) {
		const { type, value } = tree.token

		if (type === 'number') {
			return new Num(value)
		} else if (type === 'string') {
			return new Str(value)
		} else if (type === 'identifier') {
			if (value === '#t') {
				return new Bool(true)
			} else if (value === '#f') {
				return new Bool(false)
			} else if (value === 'unit') {
				return new Unit()
			} else {
				return new Var(value)
			}
		} else {
			if (tree.children.length === 0) {
				throw 'Unexpected ()'
			}

			const [form, ...args] = tree.children
			const name = form.token.value

			if (!mapping.has(name)) {
				throw 'Unsupported form'
			}

			const handler = mapping.get(name)

			return handler(...args)
		}
	}

	return { buildAst }
})()