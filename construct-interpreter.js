/*
    FUNC $w
        PRINT Ende
    RETURN

    FUNC $inc_x
        INC @x
    RETURN

    DEF @x
    SET @x 10

    PRINT @X
    CALL $inc_x
    CMP @x == 20
    JMP_C [-3]

    CALL $w
    EXIT
*/

// instruction extentions
// turtle graphics?

const OVERRIDE_TEMPLATE = {
    enabled: null,
    call: null
};

const EXIT_CODES = {
    TERMINATED: 0,
    ERROR: 1
};

const ERROR_CODES = {
    UNKNOWN_INSTR: 'Unknown Instruction',
    TYPE_MISMATCH: 'Type mismatch'
};

// enumerator of the valid argtypes
export const ARG_TYPES = {
    NONE: 0,
    SINGLE: 1,
    DOUBLE: 2,
    TRIPLE: 3,
    UNLIMITED: 4,
};

// enum for different compare action for the CMP instruction
const COMPARE = {
    EQUAL: '==',
    GREATER: '>',
    GREATER_OR_EQUAL: '>=',
    SMALLER: '<',
    SMALLER_OR_EQUAL: '<=',
    NOT: '!='
}

export const INSTR_NAME = {
    ADD_NUMBER_TO_VARIABLE: 'ANTV',
    SUBTRACT: 'SUB',
    ADD: 'ADD',
    EXIT: 'EXIT',
    PASS: 'PASS',
    JUMP: 'JMP',
    JUMP_CONDITION: 'JMP_C',
    COMPARE: 'CMP',
    DEFINE: 'DEFINE', 
    SET: 'SET', 
    PRINT: 'PRINT', 
    INPUT: 'INPUT',
    FUNCTION: 'FUNC', 
    RETURN: 'RETURN', 
    CALL: 'CALL'
}

export const defaultVarMngConfig = {
    raiseError: () => null
    // overrides
};

export const defaultFnMngConfig = {
    raiseError: () => null
    // overrides
};

const FunctionManager = (config = defaultFnMngConfig) => {
    const funtionConfig = {
        line: 0,
    };

    const checkFlag = () => null;

    const defineFn = () => null;
    const callFn = () => null;

    // functions
    const funtionRegister = {
        a: 'a'
    };
};

const VarManager = (config = defaultVarMngConfig) => {
    // delete fehlt

    // read-write
    const variableRegister = {};

    // read-only
    const outputRegister = {
        MATH: 0,
        CMD: 0,
        READ: '',
    };

    // private
    const privateRegister = {
        RETURN_LINE: 1
    }

    // write targets for special
    // write function
    const REG_TARGETS = {
        VAR: 0,         // variable
        OUT: 1,         // output
        PRIVATE: 2      // private
    }

    // writes to a special register or any other register
    // no error handling
    const write = ({ target, key, value }) => {
        if (!(target || key || value)) return null;

        // select target
        const targetReg = [variableRegister, outputRegister, privateRegister][target];
        targetReg[key] = value;
    }

    // reads a special or any other register
    // no error handling
    const read = ({ target, key }) => {
        if (!(target || key)) return null;

        // select target
        const targetReg = [variableRegister, outputRegister, privateRegister][target];
        return targetReg[key] ?? null;
    };

    // PRIVATE METHOD
    // --------------
    // gets var from varReg or outReg
    // returns null if nothing is found
    const getVar = (name = '') => {
        const flag = name[0];

        switch (flag) {
            case '@':
                return variableRegister[name.substring(1)] ?? null; // remove flag and read requested value, always return null otherwise
            case '#':
                return outputRegister[name.substring(1)] ?? null; // remove flag and read requested value, always return null otherwise
            default:
                return name;
        }
    }


    // sets var
    // returns false if name or val aren't specified
    const setVar = (name = '', val) => {
        if (!(name || name.length === 1 || val)) {
            config.raiseError({
                msg: 'Cant assign variable: invalid args'
            });

            return false;
        }

        const key = name.substring(1);

        if (variableRegister[key]) {
            variableRegister[key] = val;
            return true;
        }

        config.raiseError({
            msg: `Can't set undefined variable: ${name}`
        });

        return false;
    };

    // check whether a variable is a valid target to write to
    // handles errors CONDITIONALLY
    const isValidVar = (name = '', handleError = false) => {
        if (name.length == 1) {
            handleError && config.raiseError({
                msg: 'Invalid variable'
            });

            return false;
        } else if (name[0] !== '@') {
            handleError && config.raiseError({
                msg: "Variables must always be prefaced with '@'"
            });

            return false;
        }

        const key = name.substring(1);

        if (variableRegister[key]) {
            return true;
        }

        return false;
    };

    // defines a variable and sets it to 'true'
    // raises error(s)
    const defineVar = (name = '') => {
        if (name[0] !== '@') {
            config.raiseError({
                msg: "Variables must always be prefaced with '@'"
            });

            return false;
        }

        const key = name.substring(1);

        if (variableRegister[key]) {
            config.raiseError({
                msg: 'Repeated function decleration'
            });

            return false;
        }

        variableRegister[key] = true;
    };

    // converts var into number
    // raises error
    const resolveNumVar = (val) =>  {
        const variable = getVar(val);

        if (!variable) {
            config.raiseError({
                msg: `No variable defined with the name: ${val}`
            });

            return null;
        }

        const convertedVar = Number(variable);

        if (isNaN(convertedVar)) {
            config.raiseError({
                msg: 'Referenced Variable is not a Number'
            });

            return null;
        }
        
        return convertedVar;
    };

    // converts value or var to number
    // strictly numberic
    // raises error  
    const resolveNumVarOrNum = (val) => {
        const variable = getVar(val);

        if (variable) {
            const convertedVar = Number(variable);

            if (isNaN(convertedVar)) {
                config.raiseError({
                    msg: 'Referenced Variable is not a Number'
                });

                return null;
            }

            return convertedVar;
        }

        const convertedNum = Number(val);

        if (isNaN(convertedNum)) {
            config.raiseError({
                msg: 'Expected numeric Variable or Number'
            });

            return null;
        }
        
        return convertedNum;
    };

    // returns var if exists, otherwise returns val
    const resolveVal = (val) => {
        const variable = getVar(val);
        if (variable) {
            return variable;
        }

        config.raiseError({
            msg: `Targeted register is undefined: ${val}`
        });
    };

    const showTable = () => variableRegister;

    return {
        setVar,
        defineVar,
        resolveNumVarOrNum,
        resolveVal,
        resolveNumVar,
        isValidVar,
        showTable,
        special: {
            read,
            write,
            REG_TARGETS
        }
    }
};

// default config for the interpretor
export const defaultConfig = {
    handleError: () => null,
    delay: 0,
    extentions: {
        functions: [{
            key: 'FORWARD', // e.g. for turtlegraphic integration
            exec: () => null,
            argType: ARG_TYPES.SINGLE
        }],
        variables: [{
            key: 'distance'
        }]
    },
    overrides: {
        // not all functions support overrides (but they should idk)k: '
        // overrides are called at the top level of a function witch every argument being passed to the function
        functions: [{
            instruction: 'PRINT',
            exec: () => null
        }],
        variables: [{}]
    }
};

export const Interpreter = (config = defaultConfig) => {

    // tracks state during execution and holds
    // important information
    const state = {
        instructionArr: [],

        configError: false,

        executable: false,
        running: false,
        error: false,
        execPos: 1,

        returnLine: null,

        stop: function () {
            this.running = false;
            this.execPos = 0;
        }
    };

    // checks argument bracing {arg}, [arg] ...
    // returns processed string (plain arg)
    // used for relative "pointers"
    const checkBracing = (key = '[]', str = '[100]') => {
        const passed =
            str[0] === key[0] &&
            str[str.length - 1] === key[1];

        const processedString = passed
            ? str.substring(1, str.length - 1)
            : null;

        return { passed, processedString };
    };

    // raises an error and gives a print message
    const raiseError = ({ ...args }) => {
        const { msg } = args;
        state.error = true;
        config.handleError(`[Line ${state.execPos}] ${msg}`, args);
        state.stop();
    };

    // initializes a new varmanager object
    const varManager = VarManager({
        raiseError: raiseError
    });

    // maps the table to the respective compare function for the CMP instruction
    const compareOps = {
        [COMPARE.EQUAL]:                (x, y) => x == y,
        [COMPARE.GREATER]:              (x, y) => x > y,
        [COMPARE.GREATER_OR_EQUAL]:     (x, y) => x >= y,
        [COMPARE.NOT]:                  (x, y) => x != y,
        [COMPARE.SMALLER]:              (x, y) => x < y,
        [COMPARE.SMALLER_OR_EQUAL]:     (x, y) => x <= y
    };

    // holds every vanilla instruction
    const INSTRUCTIONS = {

        // Add number to variable
        // ANTV 25 @x
        [INSTR_NAME.ADD_NUMBER_TO_VARIABLE]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                const a = varManager.resolveNumVarOrNum(args[0]);
                const b = varManager.resolveNumVar(args[1]);

                if (!(a || b)) return;

                varManager.setVar(args[1], a + b);
            },
            argType: ARG_TYPES.DOUBLE
        },

        // Subtract and output to the math register
        // Subtracts list of args, either num or var
        [INSTR_NAME.SUBTRACT]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                let output = 0;

                args.forEach((e) => {
                    const num = varManager.resolveNumVarOrNum(e);
                    output -= num;
                });

                return output;
            },
            argType: ARG_TYPES.UNLIMITED
        },

        // Add and output to the math register
        // Adds up list of args, either num or var
        [INSTR_NAME.ADD]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                let output = 0;
                
                args.forEach((e) => {
                    const num = varManager.resolveNumVarOrNum(e);
                    output += num;
                });
                
                varManager.special.write({
                    target: varManager.special.REG_TARGETS.OUT,
                    key: 'MATH',
                    value: output
                });
            },
            argType: ARG_TYPES.UNLIMITED
        },

        [INSTR_NAME.INPUT]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                const input = prompt(`[INPUT] ${args.join(' ')}`, '');

                varManager.special.write({
                    target: varManager.special.REG_TARGETS.OUT,
                    key: 'INPUT',
                    value: input
                })
            },
            argType: ARG_TYPES.UNLIMITED
        },

        // exits the program on the next iteration and
        // resolves the promise
        [INSTR_NAME.EXIT]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function () {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                state.stop()
            },
            argType: ARG_TYPES.NONE
        },

        // blank instruction used for empty lines
        [INSTR_NAME.PASS]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function () {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                return null;
            },
            argType: ARG_TYPES.NONE
        },

        // Jumps to the specified line
        // input is either a number or num variable
        [INSTR_NAME.JUMP]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                const { passed, processedString } = checkBracing('[]', args[0]);

                // if the bracing check passes a relative pointer is being used
                // relative pointer adjust the execcution pointer relative from 
                // the current position
                if (passed) {
                    const pointer = varManager.resolveNumVarOrNum(processedString);
                    state.execPos += pointer - 1;
                } else {
                    const pointer = varManager.resolveNumVarOrNum(args[0]);
                    state.execPos = pointer - 1; // -1 to account for the execPos iteration each cycle
                }
            },
            argType: ARG_TYPES.SINGLE
        },

        // Jumps to the specified line if math_out is truthy
        // input is either a number or num variable
        [INSTR_NAME.JUMP_CONDITION]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                const { passed, processedString } = checkBracing('[]', args[0]);
                const jumps = !!varManager.special.read({
                    target: varManager.special.REG_TARGETS.OUT,
                    key: 'MATH'
                });

                if (jumps) {
                    if (passed) {
                        // relative jump
                        const pointer = varManager.resolveNumVarOrNum(processedString);
                        state.execPos += pointer - 1;
                    } else {
                        // absolute jump
                        const pointer = varManager.resolveNumVarOrNum(args[0]);
                        state.execPos = pointer - 1; // -1 to account for iteration
                    }
                }
            }, 
            argType: ARG_TYPES.SINGLE
        },

        // compares two values/variables and writes true/false
        // to the out register under CMP
        [INSTR_NAME.COMPARE]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                const [a, o, b] = [
                    varManager.resolveNumVarOrNum(args[0]),
                    args[1],
                    varManager.resolveNumVarOrNum(args[2])
                ];

                const comparator = compareOps[o];
                if (!comparator) {
                    raiseError({ msg: `Unknown comparison operator: ${o}` });
                    return;
                }

                const result = comparator(a, b);

                varManager.special.write({
                    key: 'CMP',
                    target: varManager.special.REG_TARGETS.OUT,
                    value: result
                });
            },
            argType: ARG_TYPES.TRIPLE
        },

        // defines a variable and makes it usable
        // error handling is managed through 'defineVar'
        [INSTR_NAME.DEFINE]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                varManager.defineVar(args[0]);
            },
            argType: ARG_TYPES.SINGLE
        },

        [INSTR_NAME.SET]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                const _a = args[0];
                const b = varManager.resolveVal(args[1]);

                varManager.isValidVar(_a, true)
                    ? varManager.setVar(_a, b)
                    : raiseError({ msg: `Unable to update variable: ${_a}` });
            },
            argType: ARG_TYPES.DOUBLE
        },

        [INSTR_NAME.PRINT]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                console.log(`[LOG START] ${args.join('\n')} [LOG END]`);
            },
            argType: ARG_TYPES.UNLIMITED
        },

        [INSTR_NAME.DEFINE]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                if (state.returnLine === null) {
                    return
                } else {
                    state.execPos = state.returnLine;
                }
            },
            argType: ARG_TYPES.NONE
        },

        [INSTR_NAME.RETURN]: {
            override: { ...OVERRIDE_TEMPLATE },
            exec: function (args) {
                if (this.override.enabled) {
                    this.override.call(args);
                }

                if (state.)
            },
            argType: ARG_TYPES.RETURN
        },
        CALL : {}
    };

    // custom funtion have to be added before calling this
    // appends customs overrides
    for (const { exec, instruction } of config.overrides.functions) {
        if (typeof exec === 'function' && INSTRUCTIONS[key]) {
            INSTRUCTIONS[instruction].override = {
                enabled: true,
                call: exec
            }
        } else {
            config.handleError(`Error(s) found in override config: ${key}`);
            state.configError = true;
        }
        INSTRUCTIONS[key]
    }

    // return new instruction object
    const createInstruction = (instr, args) => ({
        instruction: instr,
        args: args
    });

    const typeByCount = {
        0: ARG_TYPES.NONE,
        1: ARG_TYPES.SINGLE,
        2: ARG_TYPES.DOUBLE,
        3: ARG_TYPES.TRIPLE,
    };

    // checks for arg mismatch
    // returns either true or false
    const matchArgType = (instr, instrArgs = []) => {
        const count = instrArgs.length;

        if (instr.argType === ARG_TYPES.UNLIMITED) {
            // unlimited = 1 or more args
            return count > 0;
        }

        return instr.argType === typeByCount[count];
    };

    const processSyntax = (data = []) => {
        let errorLines = [];

        const instructionArr = data.map((rawInstrStr = '', index) => {
            // empty line
            if (!rawInstrArr) return createInstruction(INSTRUCTIONS.PASS, null);

            // split string
            const rawInstrArr = rawInstrStr.split(/\s+/);

            // assign instruction and args
            const mainInstr = INSTRUCTIONS[rawInstrArr[0]];
            const instrArgs = rawInstrArr.toSpliced(0, 1);

            if (mainInstr) {
                // match and validate types
                const argsValid = matchArgType(mainInstr, instrArgs);

                if (argsValid) return createInstruction(mainInstr.exec, instrArgs);
                
                errorLines.push({
                    index: index + 1,
                    error: ERROR_CODES.TYPE_MISMATCH
                });
            } else {
                errorLines.push({ 
                    index: index + 1,
                    error: ERROR_CODES.UNKNOWN_INSTR
                });
            }

            return createInstruction(null, null);
        });

        state.instructionArr = instructionArr;

        if (errorLines.length) {
            raiseError({
                msg: `Syntax Error(s) at line(s): ${
                    errorLines.length === 1
                        ? errorLines[0].index 
                        : errorLines.map(({ index }) => index).join(', ')
                }`
            });

            state.executable = false;
        } else {
            state.executable = true;
        }
    };

    const setCode = (data = []) => {
        state.stop();

        // validate passed data
        if (!(data && Array.isArray(data) && data.length >= 1)) {
            raiseError({
                msg: 'Passed data contains no instructions'
            });
            return;
        };

        // process the received syntax and check if it's executable
        processSyntax(data);
    };

    const startExecution = () => {
        if (state.running || state.configError) return;
        state.error = false;

        const runtime = new Promise((resolve, reject) => {
            while (state.running) {
                if (state.instructionArr.length < execPos - 1) {
                    raiseError({
                        msg: 'Instruction pointer exceeds possible boundaries'
                    });

                    break;
                }

                const { instruction, args } = state.instructionArr[state.execPos - 1];

                if (args.length) {
                    instruction(args); // avoid passing an empty array
                } else {
                    instruction();
                };

                state.execPos += 1;
            }

            if (state.error) {
                reject(EXIT_CODES.ERROR)
            } else {
                resolve(EXIT_CODES.TERMINATED);
            }
        });

        return runtime;
    }

    return { setCode, startExecution }
};