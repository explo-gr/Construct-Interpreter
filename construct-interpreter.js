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

const VarManager = (raiseError = () => null) => {
    // delete fehlt


    // read-write
    const variableRegister = {};

    // read-only
    const outputRegister = {
        MATH: 0,
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

        const targetReg = [variableRegister, outputRegister, privateRegister][target];
        targetReg[key] = value;
    }

    // reads a special or any other register
    // no error handling
    const read = ({ target, key }) => {
        if (!(target || key)) return null;

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
            raiseError({
                msg: `No numeric variable defined with the name: ${val}`
            });

            return null;
        }

        const convertedVar = Number(variable);

        if (isNaN(convertedVar)) {
            raiseError({
                msg: 'Referenced Variable is not a Number'
            });

            return null;
        }
        
        return convertedVar;
    }

    // converts value or var to number
    // raises error  
    const resolveVarOrNum = (val) => {
        const variable = getVar(val);

        if (variable) {
            const convertedVar = Number(variable);

            if (isNaN(convertedVar)) {
                raiseError({
                    msg: 'Referenced Variable is not a Number'
                });

                return null;
            }

            return convertedVar;
        }

        const convertedNum = Number(val);

        if (isNaN(convertedNum)) {
            raiseError({
                msg: 'Expected Variable or Number'
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
};

const Interpreter = (config = defaultConfig) => {

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
    }

    // raises an error and gives a print message
    const raiseError = ({ ...args }) => {
        const { msg } = args;
        state.error = true;
        config.handleError(`[Line ${state.execPos}] ${msg}`, args);
        state.stop();
    }

    // initializes a new varmanager object
    const varManager = VarManager(raiseError);

    // enumerator of the valid argtypes
    const ARG_TYPES = {
        NONE: 0,
        SINGLE: 1,
        DOUBLE: 2,
        UNLIMITED: 3,
        MISC: 4,
    };

    // holds every vanilla instruction
    const INSTRUCTIONS = {
        // Add number to variable
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
        EXIT: {
            exec: () => state.stop(),
            argType: ARG_TYPES.NONE
        },
        PASS: {
            exec: null,
            argType: ARG_TYPES.NONE
        },

        // Jumps to the specified line
        // input is either a number or num variable
        JMP: {
            exec: (args) => {
                const pointer = varManager.resolveVarOrNum(args[0]);
                state.execPos = pointer - 1; // -1 to account for the execPos iteration each cycle
            },
            argType: ARG_TYPES.SINGLE
        },

        // Jumps to the specified line if math_out is truthy
        // input is either a number or num variable
        JMP_C: {
            exec: (args) => {
                const pointer = varManager.resolveVarOrNum(args[0]);
                const jumps = !!varManager.special.read({
                    target: varManager.special.REG_TARGETS.OUT,
                    key: 'MATH'
                });

                if (jumps) {
                    state.execPos = pointer - 1;
                }
            }, 
            argType: ARG_TYPES.SINGLE
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
    const matchArgType = (instr, instrArgs = []) => {
        switch (instrArgs.length) {
            case 0:
                return instr.argType === ARG_TYPES.NONE;
            case 1:
                return instr.argType === ARG_TYPES.SINGLE || instr.argType === ARG_TYPES.UNLIMITED;
            case 2:
                return instr.argType === ARG_TYPES.DOUBLE || instr.argType === ARG_TYPES.UNLIMITED;
            default:
                return instr.argType === ARG_TYPES.UNLIMITED;
        }
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

        if (!(data && Array.isArray(data) && data.length >= 1)) {
            raiseError({
                msg: 'Passed data contains no instructions'
            });
            return;
        };

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

export default Interpreter;