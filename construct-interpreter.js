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

// enumerator of the valid argtypes
export const ARG_TYPES = {
    NONE: 0,
    SINGLE: 1,
    DOUBLE: 2,
    TRIPLE: 3,
    UNLIMITED: 4,
};

const defaultVarMngConfig = {
    raiseError: () => null
}

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
                return null;
        }
    }


    // sets var
    // returns false if name or val aren't specified
    const setVar = (name = '', val) => {
        if (!name || !val) return false;
        variableRegister[name.substring(1)] = val;
        return true;
    }

    // converts var into number
    // raises error
    const getVarNum = (val) =>  {
        const variable = getVar(val);

        if (!variable) {
            config.raiseError({
                msg: `No numeric variable defined with the name: ${val}`
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
    }

    // converts value or var to number
    // strictly numberic
    // raises error  
    const resolveVarOrNum = (val) => {
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
    }

    // returns var if exists, otherwise returns val
    const resolveVal = (val) => {
        const variable = getVar(val);
        return variable
            ? variable
            : val
    }

    const showTable = () => variableRegister;

    return {
        setVar,
        resolveVarOrNum,
        resolveVal,
        getVarNum,
        showTable,
        special: {
            read,
            write,
            REG_TARGETS
        }
    }
}

// default config for the interpretor
export const defaultConfig = {
    handleError: () => null,
    delay: 0,
    extentions: {
        functions: [{
            call: 'FORWARD', // e.g. for turtlegraphic integration
            exec: () => null,
            argType: ARG_TYPES.SINGLE
        }],
        variables: [{
            key: 'distance'
        }]
    }
};

export const Interpreter = (config = defaultConfig) => {

    // tracks state during execution and holds
    // important information
    const state = {
        instructionArr: [],
        executable: false,
        running: false,
        error: false,
        execPos: 1,

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
    const varManager = VarManager(raiseError);

    // enum for different compare action for the CMP instruction
    const COMPARE = {
        EQUAL: '==',
        GREATER: '>',
        GREATER_OR_EQUAL: '>=',
        SMALLER: '<',
        SMALLER_OR_EQUAL: '<=',
        NOT: '!='
    }

    // holds every vanilla instruction
    const INSTRUCTIONS = {

        // Add number to variable
        // ANTV 25 @x
        ANTV: {
            exec: (args) => {
                const a = varManager.resolveVarOrNum(args[0]);
                const b = varManager.getVarNum(args[1]);

                if (!(a || b)) return;

                varManager.setVar(args[1], a + b);
            },
            argType: ARG_TYPES.DOUBLE
        },

        // Subtract and output to the math register
        // Subtracts list of args, either num or var
        SUB: {
            exec: (args) => {
                let output = 0;

                args.forEach((e) => {
                    const num = varManager.resolveVarOrNum(e);
                    output -= num;
                });

                return output;
            },
            argType: ARG_TYPES.UNLIMITED
        },

        // Add and output to the math register
        // Adds up list of args, either num or var
        ADD: {
            exec: (args) => {
                let output = 0;
                
                args.forEach((e) => {
                    const num = varManager.resolveVarOrNum(e);
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

        // exits the program on the next iteration and
        // resolves the promise
        EXIT: {
            exec: () => state.stop(),
            argType: ARG_TYPES.NONE
        },

        // blank instruction used for empty lines
        PASS: {
            exec: () => null,
            argType: ARG_TYPES.NONE
        },

        // Jumps to the specified line
        // input is either a number or num variable
        JMP: {
            exec: (args) => {
                const { passed, processedString } = checkBracing('[]', args[0]);

                // if the bracing check passes a relative pointer is being used
                // relative pointer adjust the execcution pointer relative from 
                // the current position
                if (passed) {
                    const pointer = varManager.resolveVarOrNum(processedString);
                    state.execPos += pointer - 1;
                } else {
                    const pointer = varManager.resolveVarOrNum(args[0]);
                    state.execPos = pointer - 1; // -1 to account for the execPos iteration each cycle
                }
            },
            argType: ARG_TYPES.SINGLE
        },

        // Jumps to the specified line if math_out is truthy
        // input is either a number or num variable
        JMP_C: {
            exec: (args) => {
                const { passed, processedString } = checkBracing('[]', args[0]);
                const jumps = !!varManager.special.read({
                    target: varManager.special.REG_TARGETS.OUT,
                    key: 'MATH'
                });

                if (jumps) {
                    if (passed) {
                        // relative jump
                        const pointer = varManager.resolveVarOrNum(processedString);
                        state.execPos += pointer - 1;
                    } else {
                        // absolute jump
                        const pointer = varManager.resolveVarOrNum(args[0]);
                        state.execPos = pointer - 1; // -1 to account for iteration
                    }
                }
            }, 
            argType: ARG_TYPES.SINGLE
        },

        CMP: {
            exec: (args) => {
                // val a, operand, b
                const [ a, o, b ] = [
                    varManager.resolveVarOrNum(args[0]),
                    args[1],
                    varManager.resolveVarOrNum(args[2])
                ];

                let result;

                switch (o) {
                    case COMPARE.EQUAL:
                        result = a == b;
                        break;
                    case COMPARE.GREATER:
                        result = a > b;
                        break;
                    case COMPARE.GREATER_OR_EQUAL:
                        result = a >= b;
                        break;
                    case COMPARE.NOT:
                        result = a != b;
                        break;
                    case COMPARE.SMALLER:
                        result = a < b;
                        break;
                    case COMPARE.SMALLER_OR_EQUAL:
                        result = a <= b;
                        break;
                }

                varManager.special.write({
                    
                });
            },
            argType: ARG_TYPES.TRIPLE
        }
    };

    const EXIT_CODES = {
        TERMINATED: 0,
        ERROR: 1
    }

    const ERROR_CODES = {
        UNKNOWN_INSTR: 'Unknown Instruction',
        TYPE_MISMATCH: 'Type mismatch'
    }

    // return new instruction object
    const createInstruction = (instr, args) => ({
        instruction: instr,
        args: args
    });

    // checks for arg mismatch
    // returns either true or false
    const matchArgType = (instr, instrArgs = []) => {
        const count = instrArgs.length;

        // map arg length to the corresponding type
        const typeMap = {
            0: ARG_TYPES.NONE,
            1: ARG_TYPES.SINGLE,
            2: ARG_TYPES.DOUBLE,
            3: ARG_TYPES.TRIPLE,
        };

        return instr.argType === ARG_TYPES.UNLIMITED || instr.argType === typeMap[count];
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
        if (state.running) return;
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
}