const handleFuncBody = (path, _ref = { opts: {} }, t, wrapCapture, wrapCaptureWithReturn) => {

    const funcId = path.node.id
    const funcLoc = path.node.loc
    let funcBody = path.node.body.body
    let isReturnBody = false


    // 过滤 
    if (funcBody && funcBody.length === 0) {
        return
    }

    if (!funcLoc) {
        return
    }

    if (!funcBody) {
        isReturnBody = true
        funcBody = path.node.body
    }


    // 记录 ast 上的重要信息
    const funcName = funcId ? funcId.name : 'anonymous'
    const funcLine = funcLoc.start.line
    const funcErrorVariable = path.scope.generateUidIdentifier('e')
    const astTemplate = isReturnBody ? wrapCaptureWithReturn : wrapCapture

    const ast = astTemplate({
        FUNC_BODY: funcBody,
        FUNC_NAME: t.StringLiteral(funcName),
        FUNC_LINE: t.NumericLiteral(funcLine),
        ERROR_VARIABLE: funcErrorVariable
    })

    path.get('body').replaceWith(ast)
}

const catchTemplate = `
        console.log('+++++++++++++++++++++')
        console.log(ERROR_VARIABLE)
        window.JSTracker && window.JSTracker.catch({
            message: ERROR_VARIABLE.message,
            stack: ERROR_VARIABLE.stack.toString(),
            funcLine: FUNC_LINE,
            funcName: FUNC_NAME
        }, 'try-catch')
        console.log('+++++++++++++++++++++')
    `

module.exports = function (babel) {

    const t = babel.types

    const wrapCapture = babel.template(`{
        try {
            FUNC_BODY
        } catch (ERROR_VARIABLE) {
            ${catchTemplate}
        }
    }`)

    const wrapCaptureWithReturn = babel.template(`{
        try {
            return FUNC_BODY
        } catch (ERROR_VARIABLE) {
            ${catchTemplate}
        }
    }`)

    return {
        visitor: {
            FunctionDeclaration(path, _ref = { opts: {} }) {

                handleFuncBody(path, _ref = { opts: {} }, t, wrapCapture, wrapCaptureWithReturn)

            },
            ArrowFunctionExpression(path, _ref = { opts: {} }) {

                handleFuncBody(path, _ref = { opts: {} }, t, wrapCapture, wrapCaptureWithReturn)

            },
            FunctionExpression(path, _ref = { opts: {} }) {

                handleFuncBody(path, _ref = { opts: {} }, t, wrapCapture, wrapCaptureWithReturn)

            }
        }
    }
}