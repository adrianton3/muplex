(function() {
	"use strict";
	
	var Tokenizer = require('../tokenizer/Tokenizer.js').Tokenizer;
	var TokEnd = require('../tokenizer/TokEnd.js').TokEnd;
	var TokNum = require('../tokenizer/TokNum.js').TokNum;
	var TokIdentifier = require('../tokenizer/TokIdentifier.js').TokIdentifier;
	var TokBool = require('../tokenizer/TokBool.js').TokBool;
	var TokStr = require('../tokenizer/TokStr.js').TokStr;
	var TokCommSL = require('../tokenizer/TokCommSL.js').TokCommSL;
	var TokCommML = require('../tokenizer/TokCommML.js').TokCommML;
	var TokLPar = require('../tokenizer/TokLPar.js').TokLPar;
	var TokRPar = require('../tokenizer/TokRPar.js').TokRPar;
	var TokKeyword = require('../tokenizer/TokKeyword.js').TokKeyword;
	var TokenCoords = require('../tokenizer/TokenCoords.js').TokenCoords;
	
	var Add = require('../interpreter/nodes/Add.js').Add;
	var And = require('../interpreter/nodes/And.js').And;
	var Bool = require('../interpreter/nodes/Bool.js').Bool;
	var BoolQ = require('../interpreter/nodes/BoolQ.js').BoolQ;
	var Call = require('../interpreter/nodes/Call.js').Call;
	var ClosureQ = require('../interpreter/nodes/ClosureQ.js').ClosureQ;
	var ContainsQ = require('../interpreter/nodes/ContainsQ.js').ContainsQ;
	var Def = require('../interpreter/nodes/Def.js').Def;
	var Div = require('../interpreter/nodes/Div.js').Div;
	var Fst = require('../interpreter/nodes/Fst.js').Fst;
	var Fun = require('../interpreter/nodes/Fun.js').Fun;
	var If = require('../interpreter/nodes/If.js').If;
	var Let = require('../interpreter/nodes/Let.js').Let;
	var Mod = require('../interpreter/nodes/Mod.js').Mod;
	var Module = require('../interpreter/Module.js').Module;
	var ModuleSet = require('../interpreter/ModuleSet.js').ModuleSet;
	var Mul = require('../interpreter/nodes/Mul.js').Mul;
	var Not = require('../interpreter/nodes/Not.js').Not;
	var Num = require('../interpreter/nodes/Num.js').Num;
	var NumQ = require('../interpreter/nodes/NumQ.js').NumQ;
	var Or = require('../interpreter/nodes/Or.js').Or;
	var Pair = require('../interpreter/nodes/Pair.js').Pair;
	var PairQ = require('../interpreter/nodes/PairQ.js').PairQ;
	var Record = require('../interpreter/nodes/Record.js').Record;
	var RecordQ = require('../interpreter/nodes/RecordQ.js').RecordQ;
	var Snd = require('../interpreter/nodes/Snd.js').Snd;
	var Str = require('../interpreter/nodes/Str.js').Str;
	var StrQ = require('../interpreter/nodes/StrQ.js').StrQ;
	var Sub = require('../interpreter/nodes/Sub.js').Sub;
	var Unit = require('../interpreter/nodes/Unit.js').Unit;
	var UnitQ = require('../interpreter/nodes/UnitQ.js').UnitQ;
	var Var = require('../interpreter/nodes/Var.js').Var;
	var Xor = require('../interpreter/nodes/Xor.js').Xor;
	
	var VarBinding = require('../interpreter/VarBinding.js').VarBinding;
	var Env = require('../interpreter/Env.js').Env;
	
	var StaticCheck = require('../interpreter/StaticCheck.js').StaticCheck;
	var VarCheckState = require('../interpreter/VarCheckState.js').VarCheckState;
	var ToJS = require('../interpreter/ToJS.js').ToJS;
	
	var RDP = require('../parser/RDP.js').RDP;
	var Type = require('../interpreter/types/Type.js').Type;
	
	var _e = function(s, modSet) { 
		if(arguments.length > 1) return RDP.single(Tokenizer.chop(s)).ev(Env.Emp, modSet);
		else return RDP.single(Tokenizer.chop(s)).ev(Env.Emp); 
	};
	var _ej = function(s) { return eval(s); };
	var _t = function(s) { return RDP.single(Tokenizer.chop(s)).accept(new StaticCheck(), new VarCheckState(Env.Emp, null)); };
	var _m = function(s) { return RDP.tree(Tokenizer.chop(s)); };
	
	var _tr = function(s) { 
		var exp = RDP.single(Tokenizer.chop(s)); 
		return ToJS.header() + '\n\n' + exp.accept(new ToJS()); 
	};
	var _eqnj = function(s) { return _e(s).getValue() == _ej(_tr(s)); };
	
	module('toJS');
	test('Primitives', function() {
		ok(_eqnj('25'), 'num');
		ok(_eqnj('#f'), 'bool');
		ok(_eqnj('"asd"'), 'str');
		ok(_eqnj('(fst (pair 32 54))'), 'pair 1');
		ok(_eqnj('(snd (pair 32 54))'), 'pair 2');
		ok(_eqnj('(deref (record (a 10) (dsa 32)) dsa)'), 'record 1');
		ok(_eqnj('(deref (record (a 10) (dsa 32)) a)'), 'record 2');
	});
	
	test('Simple functions', function() {
		ok(_eqnj('(+ 23 54)'), '+ num num');
		ok(_eqnj('(- 23 54)'), '- num num');
		ok(_eqnj('(* 23 54)'), '* num num');
		ok(_eqnj('(/ 23 54)'), '/ num num');
		ok(_eqnj('(% 23 54)'), '% num num');
		
		ok(_eqnj('(not #t)'), 'not bool');
		ok(_eqnj('(or #t #f)'), 'or bool bool');
		ok(_eqnj('(and #t #f)'), 'and bool bool');
		ok(_eqnj('(xor #t #f)'), 'xor bool bool');
		
		ok(_eqnj('(if #t 30 20)'), 'if #t');
		ok(_eqnj('(if #f 30 20)'), 'if #f');
	});
	
	test('Let, Let*, Letrec, Fun, Call', function() {
		ok(_eqnj('(let a 10 (+ a 3))'), 'let');
		ok(_eqnj('(let* ((a 10) (b (+ a 3))) (+ b 3))'), 'let*');
		ok(_eqnj('(letrec ((a c) (b 22) (c b)) c)'), 'letrec');
		ok(_eqnj('(letrec ((f1 (lambda (x) (+ (call f2 (- x 1)) 2))) (f2 (lambda (x) (if (> x 0) (* (call f1 (- x 1)) 2) 5)))) (call f1 7))'), 'letrec');
		ok(_eqnj('(let a 10 (call (lambda (x) (+ a x)) 4))'), 'closure');
		ok(_eqnj('(let f (lambda (x y) (+ x y)) (call f 10 20))'), 'fun par1 par2');
	});
})();