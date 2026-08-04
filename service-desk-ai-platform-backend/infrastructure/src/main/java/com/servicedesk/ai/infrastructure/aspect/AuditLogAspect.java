package com.servicedesk.ai.infrastructure.aspect;

import com.servicedesk.ai.common.model.CorrelationContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class AuditLogAspect {

    @Around("execution(* com.servicedesk.ai.application.service.*.*(..))")
    public Object auditApplicationServiceCalls(ProceedingJoinPoint joinPoint) throws Throwable {
        String correlationId = CorrelationContext.getCorrelationId();
        String methodName = joinPoint.getSignature().toShortString();
        long startTime = System.currentTimeMillis();

        log.info("[AUDIT BEGIN] [CID:{}] Method: {}", correlationId, methodName);

        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            log.info("[AUDIT END] [CID:{}] Method: {} completed successfully in {} ms", correlationId, methodName, executionTime);
            return result;
        } catch (Throwable ex) {
            long executionTime = System.currentTimeMillis() - startTime;
            log.error("[AUDIT FAILED] [CID:{}] Method: {} failed in {} ms with exception: {}", correlationId, methodName, executionTime, ex.getMessage());
            throw ex;
        }
    }
}
