export const asyncHandler=(requestHandler)=>{
    try {
        return async (req,res,next) => {
            await requestHandler(req,res,next)
        }
    } catch (error) {
        res.status(error.statusCode||500).json({
            message:error.message,
            success:false
        })
    }
}